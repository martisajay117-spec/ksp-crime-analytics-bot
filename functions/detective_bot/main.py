import json
import logging
import os
import re
from datetime import datetime, timezone

import zcatalyst_sdk
from flask import Flask, Request, jsonify, make_response, request

app = Flask(__name__)
logger = logging.getLogger("detective_bot")
logger.setLevel(logging.INFO)

catalyst_app = None


def get_catalyst_app():
    global catalyst_app
    if catalyst_app is not None:
        return catalyst_app

    try:
        catalyst_app = zcatalyst_sdk.initialize()
    except Exception as exc:
        logger.warning("Catalyst SDK initialization failed, using fallback mode: %s", exc)
        catalyst_app = None

    return catalyst_app


def _sanitize_text(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9\s]", "", value or "").strip()


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


def _log_chat(session_id: str, role: str, prompt: str, language: str = "en") -> None:
    if not prompt:
        return

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    safe_prompt = prompt.replace("'", "\\'")

    try:
        catalyst = get_catalyst_app()
        datastore = catalyst.datastore()
        chat_table = datastore.table("CHATHISTORY")
        chat_table.insert_row(
            {
                "SessionID": session_id,
                "Role": role,
                "TextPrompt": safe_prompt,
                "Language": language,
                "Timestamp": timestamp,
            }
        )
    except Exception as exc:
        logger.warning("Unable to log chat row to CHATHISTORY: %s", exc)


def handler(request: Request):
    catalyst = get_catalyst_app()

    if request.path == "/predictive-chat" and request.method == "POST":
        try:
            body = request.get_json(silent=True) or {}
            user_message = body.get("message", "")
            session_id = body.get("session_id", "session_123")

            if "burglary" in user_message.lower() and catalyst is not None:
                zcql_query = "SELECT * FROM CASEMASTER WHERE BriefFacts LIKE '%burglary%'"
                query_result = catalyst.zcql().execute_query(zcql_query)
                ai_response = (
                    f"Found {len(query_result)} burglary cases. "
                    f"Details: {query_result[0].get('CASEMASTER', {}).get('BriefFacts') if query_result else 'None found.'}"
                )
            elif "burglary" in user_message.lower():
                ai_response = "Catalyst backend not available locally. Burglary search can only run after deployment."
                query_result = []
            else:
                ai_response = "I am ready to search the database. Try typing 'burglary'."
                query_result = []

            _log_chat(session_id, "user", user_message)
            _log_chat(session_id, "assistant", ai_response)

            response = make_response(jsonify({"response": ai_response}), 200)
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"
            response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
            return response

        except Exception as e:
            response = make_response(jsonify({"error": str(e)}), 500)
            response.headers["Access-Control-Allow-Origin"] = "*"
            return response

    elif request.path == "/network-data" and request.method == "GET":
        try:
            zcql_query = "SELECT * FROM ENTRY_LINK_MATRIX LIMIT 10"
            graph_data = catalyst.zcql().execute_query(zcql_query)
            response = make_response(jsonify({"data": graph_data}), 200)
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"
            response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
            return response
        except Exception as e:
            response = make_response(jsonify({"error": str(e)}), 500)
            response.headers["Access-Control-Allow-Origin"] = "*"
            return response

    response = make_response(jsonify({"message": "Detective Bot API is running!"}), 200)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/predictive-chat", methods=["POST"])
def flask_predictive_chat():
    return handler(request)


@app.route("/network-data", methods=["GET"])
def flask_network_data():
    return handler(request)


@app.route("/", defaults={"path": ""}, methods=["GET", "POST"])
@app.route("/<path:path>", methods=["GET", "POST"])
def catch_all(path=""):
    return handler(request)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), debug=False)
