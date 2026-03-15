from __future__ import annotations

import json
from typing import Any

import requests


BASE_URL = "http://localhost:8000"
EMAIL = "test@vexor.az"
PASSWORD = "Test1234!"
COMPANY = "Vexor Test"
SEPARATOR = "=" * 50

PHISHING_PAYLOAD = {
    "email_body": "Hörmətli müştəri, hesabınız bloklanıb. Dərhal təsdiqləyin: http://mərkəzibank-az.ru/verify",
    "sender_email": "support@mərkəzibank-az.ru",
    "reply_to": "steal@hackers-ru.com",
}

SAFE_PAYLOAD = {
    "email_body": "Hörmətli Əli bəy, sabah saat 10:00-da görüş təyin edilmişdir. Hörmətlə, Leyla xanım",
    "sender_email": "leyla@company.az",
    "reply_to": None,
}


pass_count = 0
fail_count = 0
access_token: str | None = None


def print_separator() -> None:
    print(SEPARATOR)


def mark_pass(name: str) -> None:
    global pass_count
    pass_count += 1
    print(f"PASS: {name}")


def mark_fail(name: str, error: Exception | str) -> None:
    global fail_count
    fail_count += 1
    print(f"FAIL: {name}")
    print(error)


def pretty_print(data: Any) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=False))


def require_token() -> str:
    if not access_token:
        raise AssertionError("No access token available")
    return access_token


def test_health_check() -> None:
    name = "HEALTH CHECK"
    print_separator()
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=15)
        assert response.status_code == 200, response.text
        pretty_print(response.json())
        mark_pass(name)
    except Exception as exc:
        mark_fail(name, exc)


def test_register_user() -> None:
    global access_token

    name = "REGISTER USER"
    print_separator()
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            data={"email": EMAIL, "password": PASSWORD, "company": COMPANY},
            timeout=15,
        )
        if response.status_code == 400:
            print("Already registered, proceeding to login")
            mark_pass(name)
            return

        assert response.status_code == 200, response.text
        data = response.json()
        access_token = data["access_token"]
        print("Registered:", data["user"]["email"])
        mark_pass(name)
    except Exception as exc:
        mark_fail(name, exc)


def test_login() -> None:
    global access_token

    name = "LOGIN"
    print_separator()
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data={"email": EMAIL, "password": PASSWORD},
            timeout=15,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        access_token = data["access_token"]
        print("Logged in:", data["user"]["email"])
        mark_pass(name)
    except Exception as exc:
        mark_fail(name, exc)


def test_analyze_critical() -> None:
    name = "ANALYZE CRITICAL PHISHING"
    print_separator()
    try:
        token = require_token()
        response = requests.post(
            f"{BASE_URL}/analyze",
            headers={"Authorization": f"Bearer {token}"},
            json=PHISHING_PAYLOAD,
            timeout=30,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["risk_level"] == "CRITICAL", data
        assert data["domain_mismatch"] is True, data
        assert data["matched_org"] is not None, data
        assert data["log_id"] is not None, data
        pretty_print(data)
        mark_pass(name)
    except Exception as exc:
        mark_fail(name, exc)


def test_analyze_safe() -> None:
    name = "ANALYZE SAFE EMAIL"
    print_separator()
    try:
        token = require_token()
        response = requests.post(
            f"{BASE_URL}/analyze",
            headers={"Authorization": f"Bearer {token}"},
            json=SAFE_PAYLOAD,
            timeout=30,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["risk_level"] in ["LOW", "MEDIUM"], data
        assert data["domain_mismatch"] is False, data
        pretty_print(data)
        mark_pass(name)
    except Exception as exc:
        mark_fail(name, exc)


def test_analyze_anonymous() -> None:
    name = "ANALYZE ANONYMOUS"
    print_separator()
    try:
        response = requests.post(
            f"{BASE_URL}/analyze",
            json=PHISHING_PAYLOAD,
            timeout=30,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["log_id"] is not None, data
        print("Anonymous analysis works")
        pretty_print(data)
        mark_pass(name)
    except Exception as exc:
        mark_fail(name, exc)


def test_stats_me() -> None:
    name = "STATS MY STATS"
    print_separator()
    try:
        token = require_token()
        response = requests.get(
            f"{BASE_URL}/stats/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["total_analyses"] >= 2, data
        print("total_analyses:", data["total_analyses"])
        print("critical_count:", data["critical_count"])
        print("top_targeted_orgs:", data["top_targeted_orgs"])
        mark_pass(name)
    except Exception as exc:
        mark_fail(name, exc)


def test_stats_overview() -> None:
    name = "STATS OVERVIEW"
    print_separator()
    try:
        token = require_token()
        response = requests.get(
            f"{BASE_URL}/stats/overview",
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        print("total_analyses_platform:", data["total_analyses_platform"])
        print("critical_rate:", data["critical_rate"])
        print("top_targeted_orgs:", data["top_targeted_orgs"])
        mark_pass(name)
    except Exception as exc:
        mark_fail(name, exc)


def test_stats_timeline() -> None:
    name = "STATS TIMELINE"
    print_separator()
    try:
        token = require_token()
        response = requests.get(
            f"{BASE_URL}/stats/timeline",
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        assert response.status_code == 200, response.text
        data = response.json()
        for item in data.get("timeline", []):
            print(item["date"], item["total"])
        mark_pass(name)
    except Exception as exc:
        mark_fail(name, exc)


def test_rate_limit() -> None:
    name = "RATE LIMIT TEST"
    print_separator()
    try:
        statuses = []
        for _ in range(11):
            response = requests.post(
                f"{BASE_URL}/analyze",
                json=PHISHING_PAYLOAD,
                timeout=30,
            )
            statuses.append(response.status_code)

        assert any(status == 429 for status in statuses), statuses
        print("Rate limiting works")
        print("Statuses:", statuses)
        mark_pass(name)
    except Exception as exc:
        mark_fail(name, exc)


if __name__ == "__main__":
    test_health_check()
    test_register_user()
    test_login()
    test_analyze_critical()
    test_analyze_safe()
    test_analyze_anonymous()
    test_stats_me()
    test_stats_overview()
    test_stats_timeline()
    test_rate_limit()

    print_separator()
    print(f"TOTAL PASS: {pass_count}")
    print(f"TOTAL FAIL: {fail_count}")
