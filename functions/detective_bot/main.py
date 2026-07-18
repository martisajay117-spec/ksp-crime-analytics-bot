import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone

import zcatalyst_sdk
from flask import Flask, Request, jsonify, make_response, request

app = Flask(__name__)
logger = logging.getLogger("detective_bot")
logger.setLevel(logging.INFO)

catalyst_app = None
AUTH_TOKENS = {}
CHAT_HISTORY = {}
AUDIT_LOG = []

USER_STORE = {
    "investigator": {"password": "investigate123", "role": "Investigator"},
    "analyst": {"password": "analyze123", "role": "Analyst"},
    "supervisor": {"password": "supervise123", "role": "Supervisor"},
    "administrator": {"password": "admin123", "role": "Administrator"},
}

LOCAL_DATA = {
    "cases": [
        {
            "id": 1,
            "case_no": "KA-MYS-001",
            "brief_facts": "Burglary of government office at Mysuru Central confirmed with CCTV evidence.",
            "status": "Open",
            "date": "2026-06-12",
            "location": "Mysuru Central",
            "category": "Burglary",
            "victim": "N. Shruthi",
            "accused": "Ramesh Naik",
            "accused_id": 1,
            "value": 120000,
            "modus": "Forced entry",
            "evidence": "CCTV footage shows suspect entering through rear door",
        },
        {
            "id": 2,
            "case_no": "KA-MYS-002",
            "brief_facts": "Financial fraud involving forged bank transfers and suspicious wallets.",
            "status": "Investigating",
            "date": "2026-05-18",
            "location": "Mysuru West",
            "category": "Financial Crime",
            "victim": "R. Selvam",
            "accused": "Anitha S.",
            "accused_id": 2,
            "value": 850000,
            "modus": "Forgery",
            "evidence": "Bank statement mismatch and WhatsApp payment requests",
        },
        {
            "id": 3,
            "case_no": "KA-MYS-003",
            "brief_facts": "Vehicle theft ring intercepted near Chamundi Hills during late night patrol.",
            "status": "Closed",
            "date": "2026-04-27",
            "location": "Chamundi Hills",
            "category": "Vehicle Theft",
            "victim": "S. Mahesh",
            "accused": "Kiran Gowda",
            "accused_id": 3,
            "value": 450000,
            "modus": "Key duplication",
            "evidence": "Recovered vehicle with forged ownership documents",
        },
        {
            "id": 4,
            "case_no": "KA-MYS-004",
            "brief_facts": "Repeat offender burglary in Nazarbad market district against jewelry shop.",
            "status": "Open",
            "date": "2026-07-02",
            "location": "Nazarbad",
            "category": "Burglary",
            "victim": "P. Krishnan",
            "accused": "Ramesh Naik",
            "accused_id": 1,
            "value": 300000,
            "modus": "Night entry",
            "evidence": "Fingerprints and matching prior case pattern",
        },
    ],
    "accused": [
        {
            "id": 1,
            "name": "Ramesh Naik",
            "age": 38,
            "gender": "Male",
            "education": "High School",
            "migration": "Local",
            "income": "Low",
            "behavior": "Repeat burglary leader with strong local networks and evasive behavior.",
            "repeat_offender_count": 5,
            "risk_score": 92,
            "crm_profile": "High risk due to repeat patterns, market area focus, and multiple aliases.",
        },
        {
            "id": 2,
            "name": "Anitha S.",
            "age": 31,
            "gender": "Female",
            "education": "Graduate",
            "migration": "Inter-district",
            "income": "Middle",
            "behavior": "Structured financial fraud operator with digital payment links.",
            "repeat_offender_count": 2,
            "risk_score": 84,
            "crm_profile": "Financial crime specialist with prior wallet fraud and forged documents.",
        },
        {
            "id": 3,
            "name": "Kiran Gowda",
            "age": 29,
            "gender": "Male",
            "education": "Diploma",
            "migration": "Urban",
            "income": "Low",
            "behavior": "Group-affiliated vehicle theft suspect with nighttime coordination.",
            "repeat_offender_count": 3,
            "risk_score": 76,
            "crm_profile": "Vehicle theft ring participant with gang-style operations.",
        },
    ],
    "transactions": [
        {
            "id": "TX-001",
            "case_id": 2,
            "amount": 400000,
            "date": "2026-05-16",
            "from": "Acct *0029",
            "to": "Wallet *7721",
            "location": "Mysuru West",
            "suspicious": True,
            "notes": "Large value transfer into unknown account ahead of fraud report.",
        },
        {
            "id": "TX-002",
            "case_id": 2,
            "amount": 450000,
            "date": "2026-05-17",
            "from": "Acct *0029",
            "to": "Vehicle Seller",
            "location": "Mysuru West",
            "suspicious": True,
            "notes": "Funds moved to purchase assets after bogus invoice generation.",
        },
    ],
    "network": [
        {"source": "Ramesh Naik", "target": "Anitha S.", "relation": "Coordinator"},
        {"source": "Ramesh Naik", "target": "KA-05 AB 1234", "relation": "Vehicle"},
        {"source": "Ramesh Naik", "target": "+91 98450 88441", "relation": "Phone"},
        {"source": "Anitha S.", "target": "Acct *0029", "relation": "Bank"},
        {"source": "Anitha S.", "target": "Wallet *7721", "relation": "Wallet"},
        {"source": "Kiran Gowda", "target": "Chamundi Hills", "relation": "Location"},
    ],
}

ROLE_PERMISSIONS = {
    "Investigator": ["predictive-chat", "pattern-analytics", "socio-insights", "offender-profiling", "investigation-support", "financial-crime", "forecast", "network-data"],
    "Analyst": ["predictive-chat", "pattern-analytics", "socio-insights", "financial-crime", "network-data"],
    "Supervisor": ["predictive-chat", "pattern-analytics", "socio-insights", "offender-profiling", "forecast", "network-data"],
    "Administrator": ["predictive-chat", "pattern-analytics", "socio-insights", "offender-profiling", "investigation-support", "financial-crime", "forecast", "network-data", "audit-logs"],
}


def make_json_response(payload, status=200):
    response = make_response(jsonify(payload), status)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


def authorize_request():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "", 1).strip()
    return AUTH_TOKENS.get(token)


def record_audit(username, role, action, details=None):
    AUDIT_LOG.append(
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user": username,
            "role": role,
            "action": action,
            "details": details or {},
        }
    )


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


def _build_query_terms(message: str):
    cleaned = _sanitize_text(message).lower()
    return [token for token in cleaned.split() if len(token) > 2]


def _score_confidence(matches):
    return min(0.95, 0.55 + 0.08 * len(matches))


def search_local_cases(message: str):
    terms = _build_query_terms(message)
    if not terms:
        return LOCAL_DATA["cases"], LOCAL_DATA["cases"][:3]

    results = []
    for case in LOCAL_DATA["cases"]:
        normalized = " ".join(
            [case["brief_facts"].lower(), case["case_no"].lower(), case["location"].lower(), case["category"].lower(), case["victim"].lower(), case["accused"].lower()]
        )
        score = sum(1 for term in terms if term in normalized)
        if score > 0:
            results.append((score, case))

    results.sort(key=lambda item: (-item[0], item[1]["date"]), reverse=False)
    return [case for _, case in results], [case for _, case in results][:3]


def build_explanation(matches, source):
    evidence = []
    for case in matches[:3]:
        evidence.append(
            {
                "record_id": case["case_no"],
                "source": source,
                "excerpt": case["brief_facts"],
            }
        )
    return evidence


def build_answer(message: str, source: str, matches):
    if not matches:
        return "I could not find a matching record from the available data right now."
    headline = f"Found {len(matches)} match(es) in {source}."
    top_case = matches[0]
    return f"{headline} Top case: {top_case['case_no']} at {top_case['location']}."


def append_chat(session_id: str, role: str, message: str, language: str = "en"):
    if not session_id:
        session_id = str(uuid.uuid4())
    CHAT_HISTORY.setdefault(session_id, []).append(
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "role": role,
            "message": message,
            "language": language,
        }
    )
    return session_id


def run_catalyst_search(query: str):
    catalyst = get_catalyst_app()
    if catalyst is None:
        return [], "Local Mock"

    try:
        zcql_query = f"SELECT * FROM CASEMASTER WHERE BriefFacts LIKE '%{query}%' LIMIT 20"
        result = catalyst.zcql().execute_query(zcql_query)
        return result, "Catalyst CASEMASTER"
    except Exception as exc:
        logger.warning("Catalyst search failed: %s", exc)
        return [], "Local Mock"


def auth_login():
    payload = request.get_json(silent=True) or {}
    username = payload.get("username", "").strip()
    password = payload.get("password", "")

    user = USER_STORE.get(username)
    if not user or user["password"] != password:
        return make_json_response({"status": "error", "message": "Invalid credentials."}, 401)

    token = str(uuid.uuid4())
    AUTH_TOKENS[token] = {"username": username, "role": user["role"], "created_at": datetime.now(timezone.utc).isoformat()}
    record_audit(username, user["role"], "login", {"ip": request.remote_addr})
    return make_json_response({"status": "success", "token": token, "role": user["role"]}, 200)


def auth_whoami():
    user = authorize_request()
    if not user:
        return make_json_response({"status": "error", "message": "Unauthorized."}, 401)
    return make_json_response({"status": "success", "user": user}, 200)


def chat_history():
    user = authorize_request()
    session_id = request.args.get("session_id", "session_123")
    if not user:
        return make_json_response({"status": "error", "message": "Unauthorized."}, 401)
    return make_json_response({"status": "success", "history": CHAT_HISTORY.get(session_id, [])}, 200)


def predictive_chat():
    user = authorize_request()
    if user is None:
        return make_json_response({"status": "error", "message": "Unauthorized."}, 401)

    body = request.get_json(silent=True) or {}
    user_message = body.get("message", "").strip()
    session_id = body.get("session_id") or str(uuid.uuid4())
    language = body.get("language", "en")

    if not user_message:
        return make_json_response({"status": "error", "message": "A non-empty message is required."}, 400)

    append_chat(session_id, "user", user_message, language)
    record_audit(user["username"], user["role"], "predictive-chat", {"message": user_message, "session_id": session_id})

    terms = _build_query_terms(user_message)
    matches, top_matches = [], []
    source = "Local Mock"
    if get_catalyst_app() is not None and any(term in ["burglary", "fraud", "theft", "financial", "network"] for term in terms):
        matches, source = run_catalyst_search(" ".join(terms))
    if not matches:
        matches, top_matches = search_local_cases(user_message)

    answer = build_answer(user_message, source, matches)
    confidence = _score_confidence(matches)
    explanation = build_explanation(matches, source)

    append_chat(session_id, "assistant", answer, language)

    return make_json_response(
        {
            "status": "success",
            "answer": answer,
            "source": source,
            "query": " ".join(terms) if terms else user_message,
            "matches": matches,
            "explain": {
                "confidence": round(confidence, 2),
                "reasoning": "Ranked matches using case similarity, location, category, and victim/accused references.",
                "evidence": explanation,
            },
            "session_id": session_id,
        },
        200,
    )


def network_data():
    user = authorize_request()
    if user is None:
        return make_json_response({"status": "error", "message": "Unauthorized."}, 401)

    graph_edges = []
    nodes = {}
    for link in LOCAL_DATA["network"]:
        nodes[link["source"]] = True
        nodes[link["target"]] = True
        graph_edges.append({"source": link["source"], "target": link["target"], "label": link["relation"]})

    node_list = [{"id": key, "label": key} for key in nodes]
    repeaters = [acc for acc in LOCAL_DATA["accused"] if acc["repeat_offender_count"] > 2]
    organized = [acc["name"] for acc in repeaters]

    record_audit(user["username"], user["role"], "network-data", {})
    return make_json_response(
        {
            "status": "success",
            "nodes": node_list,
            "edges": graph_edges,
            "organized_crime": organized,
            "repeat_offender_network": [acc["name"] for acc in repeaters],
        },
        200,
    )


def pattern_analytics():
    user = authorize_request()
    if user is None:
        return make_json_response({"status": "error", "message": "Unauthorized."}, 401)

    month_counts = {}
    category_counts = {}
    hotspot_counts = {}
    modus_counts = {}

    for case in LOCAL_DATA["cases"]:
        month = datetime.fromisoformat(case["date"]).strftime("%b %Y")
        month_counts[month] = month_counts.get(month, 0) + 1
        category_counts[case["category"]] = category_counts.get(case["category"], 0) + 1
        hotspot_counts[case["location"]] = hotspot_counts.get(case["location"], 0) + 1
        modus_counts[case["modus"]] = modus_counts.get(case["modus"], 0) + 1

    trend_labels = sorted(month_counts.keys(), key=lambda x: datetime.strptime(x, "%b %Y"))
    trend_values = [month_counts[label] for label in trend_labels]
    top_hotspots = sorted(hotspot_counts.items(), key=lambda item: item[1], reverse=True)[:5]
    modus_patterns = sorted(modus_counts.items(), key=lambda item: item[1], reverse=True)[:5]

    record_audit(user["username"], user["role"], "pattern-analytics", {})
    return make_json_response(
        {
            "status": "success",
            "crime_trend": {"labels": trend_labels, "values": trend_values},
            "category_distribution": {"labels": list(category_counts.keys()), "values": list(category_counts.values())},
            "hotspots": [{"name": name, "score": count * 10, "level": "Critical" if count > 1 else "High", "description": f"{count} incidents in {name}."} for name, count in top_hotspots],
            "seasonal_analysis": {"labels": trend_labels, "values": trend_values},
            "modus_patterns": [{"modus": modus, "count": count} for modus, count in modus_patterns],
        },
        200,
    )


def socio_insights():
    user = authorize_request()
    if user is None:
        return make_json_response({"status": "error", "message": "Unauthorized."}, 401)

    age_buckets = {"18-25": 0, "26-35": 0, "36-45": 0, "46+": 0}
    gender_counts = {}
    education_counts = {}
    migration_counts = {}
    income_counts = {}
    urban_count = 0

    for accused in LOCAL_DATA["accused"]:
        age = accused["age"]
        if age <= 25:
            age_buckets["18-25"] += 1
        elif age <= 35:
            age_buckets["26-35"] += 1
        elif age <= 45:
            age_buckets["36-45"] += 1
        else:
            age_buckets["46+"] += 1
        gender_counts[accused["gender"]] = gender_counts.get(accused["gender"], 0) + 1
        education_counts[accused["education"]] = education_counts.get(accused["education"], 0) + 1
        migration_counts[accused["migration"]] = migration_counts.get(accused["migration"], 0) + 1
        income_counts[accused["income"]] = income_counts.get(accused["income"], 0) + 1
        if accused["migration"] in ["Urban", "Inter-district"]:
            urban_count += 1

    record_audit(user["username"], user["role"], "socio-insights", {})
    return make_json_response(
        {
            "status": "success",
            "age_distribution": age_buckets,
            "gender_distribution": gender_counts,
            "education_distribution": education_counts,
            "migration_distribution": migration_counts,
            "economic_indicators": income_counts,
            "urbanization_ratio": {"urban": urban_count, "rural": max(0, len(LOCAL_DATA["accused"]) - urban_count)},
        },
        200,
    )


def offender_profiling():
    user = authorize_request()
    if user is None:
        return make_json_response({"status": "error", "message": "Unauthorized."}, 401)

    profiles = [
        {
            "id": accused["id"],
            "name": accused["name"],
            "risk_score": accused["risk_score"],
            "repeat_offender_count": accused["repeat_offender_count"],
            "behavior": accused["behavior"],
            "education": accused["education"],
            "migration": accused["migration"],
            "socioeconomic": accused["income"],
            "profile": accused["crm_profile"],
        }
        for accused in LOCAL_DATA["accused"]
    ]

    record_audit(user["username"], user["role"], "offender-profiling", {})
    return make_json_response({"status": "success", "profiles": profiles}, 200)


def investigation_support():
    user = authorize_request()
    if user is None:
        return make_json_response({"status": "error", "message": "Unauthorized."}, 401)

    case_id = request.args.get("case_id")
    if case_id:
        matches = [case for case in LOCAL_DATA["cases"] if str(case["id"]) == case_id]
    else:
        matches = LOCAL_DATA["cases"][:1]

    if not matches:
        return make_json_response({"status": "error", "message": "Case not found."}, 404)

    case = matches[0]
    timeline = [
        {"date": case["date"], "event": f"Case registered for {case['category']}"},
        {"date": case["date"], "event": f"First investigation assigned to {case['location']} unit"},
        {"date": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "event": "Evidence review completed."},
    ]
    similar = [c for c in LOCAL_DATA["cases"] if c["location"] == case["location"] and c["id"] != case["id"]][:3]
    recommendations = [
        "Deploy targeted foot patrols in the hotspot area.",
        "Review CCTV feeds from the surrounding locations.",
        "Coordinate with financial intelligence for related transactions.",
    ]
    record_audit(user["username"], user["role"], "investigation-support", {"case_id": case_id or case["id"]})
    return make_json_response(
        {
            "status": "success",
            "case_summary": {
                "case_no": case["case_no"],
                "brief_facts": case["brief_facts"],
                "location": case["location"],
                "status": case["status"],
                "accused": case["accused"],
                "victim": case["victim"],
            },
            "timeline": timeline,
            "similar_cases": similar,
            "recommendations": recommendations,
        },
        200,
    )


def financial_crime():
    user = authorize_request()
    if user is None:
        return make_json_response({"status": "error", "message": "Unauthorized."}, 401)

    suspicious = [tx for tx in LOCAL_DATA["transactions"] if tx["suspicious"]]
    money_trail = []
    for tx in suspicious:
        money_trail.append({"source": tx["from"], "target": tx["to"], "amount": tx["amount"], "date": tx["date"]})

    record_audit(user["username"], user["role"], "financial-crime", {})
    return make_json_response(
        {
            "status": "success",
            "suspicious_transactions": suspicious,
            "money_trail": money_trail,
        },
        200,
    )


def forecast():
    user = authorize_request()
    if user is None:
        return make_json_response({"status": "error", "message": "Unauthorized."}, 401)

    hotspot_counts = {}
    for case in LOCAL_DATA["cases"]:
        hotspot_counts[case["location"]] = hotspot_counts.get(case["location"], 0) + 1

    top_hotspots = sorted(hotspot_counts.items(), key=lambda item: item[1], reverse=True)[:3]
    predictions = [
        {"location": location, "predicted_risk": min(100, count * 25 + 10), "alert": "High" if count > 1 else "Medium"}
        for location, count in top_hotspots
    ]
    record_audit(user["username"], user["role"], "forecast", {})
    return make_json_response(
        {
            "status": "success",
            "predictions": predictions,
            "early_warnings": [p for p in predictions if p["alert"] in ["High", "Medium"]],
        },
        200,
    )


def audit_logs():
    user = authorize_request()
    if not user or user["role"] != "Administrator":
        return make_json_response({"status": "error", "message": "Unauthorized."}, 401)
    return make_json_response({"status": "success", "audit": AUDIT_LOG}, 200)


def handler(request: Request):
    if request.method == "OPTIONS":
        return make_json_response({}, 204)

    if request.path == "/auth/login" and request.method == "POST":
        return auth_login()
    if request.path == "/auth/whoami" and request.method == "GET":
        return auth_whoami()
    if request.path == "/chat-history" and request.method == "GET":
        return chat_history()
    if request.path == "/predictive-chat" and request.method == "POST":
        return predictive_chat()
    if request.path == "/network-data" and request.method == "GET":
        return network_data()
    if request.path == "/pattern-analytics" and request.method == "GET":
        return pattern_analytics()
    if request.path == "/socio-insights" and request.method == "GET":
        return socio_insights()
    if request.path == "/offender-profiling" and request.method == "GET":
        return offender_profiling()
    if request.path == "/investigation-support" and request.method == "GET":
        return investigation_support()
    if request.path == "/financial-crime" and request.method == "GET":
        return financial_crime()
    if request.path == "/forecast" and request.method == "GET":
        return forecast()
    if request.path == "/audit-logs" and request.method == "GET":
        return audit_logs()

    return make_json_response({"message": "Detective Bot API is running!"}, 200)


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/auth/login", methods=["POST"])
def flask_auth_login():
    return handler(request)


@app.route("/auth/whoami", methods=["GET"])
def flask_auth_whoami():
    return handler(request)


@app.route("/chat-history", methods=["GET"])
def flask_chat_history():
    return handler(request)


@app.route("/predictive-chat", methods=["POST"])
def flask_predictive_chat():
    return handler(request)


@app.route("/network-data", methods=["GET"])
def flask_network_data():
    return handler(request)


@app.route("/pattern-analytics", methods=["GET"])
def flask_pattern_analytics():
    return handler(request)


@app.route("/socio-insights", methods=["GET"])
def flask_socio_insights():
    return handler(request)


@app.route("/offender-profiling", methods=["GET"])
def flask_offender_profiling():
    return handler(request)


@app.route("/investigation-support", methods=["GET"])
def flask_investigation_support():
    return handler(request)


@app.route("/financial-crime", methods=["GET"])
def flask_financial_crime():
    return handler(request)


@app.route("/forecast", methods=["GET"])
def flask_forecast():
    return handler(request)


@app.route("/audit-logs", methods=["GET"])
def flask_audit_logs():
    return handler(request)


@app.route("/", defaults={"path": ""}, methods=["GET", "POST", "OPTIONS"])
@app.route("/<path:path>", methods=["GET", "POST", "OPTIONS"])
def catch_all(path=""):
    return handler(request)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), debug=False)
