import logging
import os
import re
from datetime import datetime, timezone

import zcatalyst_sdk
from flask import Flask, jsonify, request

app = Flask(__name__)
logger = logging.getLogger("detective_bot")
logger.setLevel(logging.INFO)

try:
    catalyst = zcatalyst_sdk.initialize()
except TypeError:
    catalyst = zcatalyst_sdk.initialize(app=app)


def _get_zcql_service():
    if catalyst is None:
        raise RuntimeError("Catalyst SDK could not be initialized.")
    if hasattr(catalyst, "zcql"):
        return catalyst.zcql()
    raise RuntimeError("Catalyst SDK did not expose a zcql service.")


def _sanitize_text(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9\s]", "", value or "").strip()


def _log_chat(message: str) -> None:
    if not message:
        return

    timestamp = datetime.now(timezone.utc).isoformat()
    safe_message = message.replace("'", "\\'")

    try:
        zcql_service = _get_zcql_service()
        zcql_service.execute_query(
            f"INSERT INTO CHATHISTORY (Message, CreatedAt) VALUES ('{safe_message}', '{timestamp}')"
        )
    except Exception as exc:
        logger.warning("Unable to log chat message to CHATHISTORY: %s", exc)


def _build_search_query(message: str):
    cleaned = _sanitize_text(message).lower()
    if not cleaned:
        return "SELECT * FROM CASEMASTER LIMIT 10", "CASEMASTER"

    if any(word in cleaned for word in ["accused", "suspect", "criminal", "perpetrator"]):
        tokens = [token for token in re.findall(r"[a-z0-9]+", cleaned) if len(token) > 2]
        if tokens:
            keyword = tokens[0]
            return (
                f"SELECT * FROM Accused WHERE Name LIKE '%{keyword}%' OR Alias LIKE '%{keyword}%' LIMIT 10",
                "Accused",
            )
        return "SELECT * FROM Accused LIMIT 10", "Accused"

    tokens = [token for token in re.findall(r"[a-z0-9]+", cleaned) if len(token) > 2]
    if tokens:
        keyword = tokens[0]
        return (
            f"SELECT * FROM CASEMASTER WHERE CaseNo LIKE '%{keyword}%' OR BriefFacts LIKE '%{keyword}%' LIMIT 10",
            "CASEMASTER",
        )

    return "SELECT * FROM CASEMASTER LIMIT 10", "CASEMASTER"


def _build_answer(message: str, source: str, rows):
    if not rows:
        return "I could not find a matching record from the available data right now."

    count = len(rows)
    return (
        f"I found {count} potential match(es) in {source} based on your message: '{message}'. "
        "The most relevant record is shown in the response payload."
    )


@app.route("/predictive-chat", methods=["POST"])
def predictive_chat():
    payload = request.get_json(silent=True) or {}
    message = payload.get("message") or request.form.get("message") or request.args.get("message")

    if not message or not str(message).strip():
        return jsonify({"status": "error", "message": "A non-empty message is required."}), 400

    _log_chat(str(message))

    query, source = _build_search_query(str(message))

    try:
        zcql_service = _get_zcql_service()
        records = zcql_service.execute_query(query)
    except Exception as exc:
        logger.warning("Query failed for predictive chat: %s", exc)
        records = []

    return jsonify(
        {
            "status": "success",
            "answer": _build_answer(str(message), source, records),
            "source": source,
            "query": query,
            "matches": records,
        }
    ), 200


@app.route("/network-data", methods=["GET"])
def network_data():
    try:
        zcql_service = _get_zcql_service()
        records = zcql_service.execute_query("SELECT * FROM ENTRY_LINK_MATRIX LIMIT 50")
    except Exception as exc:
        logger.warning("Could not retrieve ENTRY_LINK_MATRIX records: %s", exc)
        records = []

    nodes = []
    edges = []

    for row in records:
        if not isinstance(row, dict):
            continue

        source = row.get("Source") or row.get("source") or row.get("From") or row.get("from")
        target = row.get("Target") or row.get("target") or row.get("To") or row.get("to")
        label = row.get("LinkType") or row.get("linkType") or row.get("Relation") or row.get("relation") or "related"

        if source and target:
            nodes.append({"id": str(source), "label": str(source)})
            nodes.append({"id": str(target), "label": str(target)})
            edges.append({"source": str(source), "target": str(target), "label": str(label)})

    return jsonify({"status": "success", "records": records, "nodes": nodes, "edges": edges}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), debug=False)
