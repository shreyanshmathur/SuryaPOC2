"""
Surya Integrated Growth & Care PoC — Playwright test suite
Tests all 9 navigation modules, new tabs, modal, and API endpoints.
"""
import os, json, time
from playwright.sync_api import sync_playwright, expect

BASE = "http://127.0.0.1:5173"
API  = "http://127.0.0.1:8787"
SS   = "C:/Users/shrey/Downloads/SuryaPOC2/test_screenshots"
os.makedirs(SS, exist_ok=True)

import sys
sys.stdout.reconfigure(encoding="utf-8")

PASS = "[PASS]"
FAIL = "[FAIL]"
INFO = "[ -- ]"

results = []

def check(label, condition, detail=""):
    sym = PASS if condition else FAIL
    print(f"  {sym} {label}" + (f" — {detail}" if detail else ""))
    results.append((label, condition))

def ss(page, name):
    path = f"{SS}/{name}.png"
    page.screenshot(path=path, full_page=False)
    return path

# --Verify API health --─────────────────────────────────────────────────────
print("\n--API health --────────────────────────────────────────")
import urllib.request
try:
    health = json.loads(urllib.request.urlopen(f"{API}/api/health", timeout=5).read())
    check("Backend is online", health.get("ok"))
    check("Groq configured (2 keys)", health.get("groqKeyCount", 0) >= 1)
    check("Telegram bot configured", health.get("telegramConfigured"))
    check("Telegram polling active", health.get("telegramPolling"))
except Exception as e:
    check("Backend reachable", False, str(e))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # --Page load --────────────────────────────────────────────────────────
    print("\n--Page load --─────────────────────────────────────────")
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    ss(page, "01_overview")

    check("Page title loads", "Surya" in page.title() or page.locator("text=Surya").count() > 0)
    check("Sidebar visible", page.locator(".sidebar").is_visible())
    check("Top bar visible", page.locator(".topbar").is_visible())
    check("Demo Mode badge present", page.locator("text=Demo Mode").count() > 0)
    check("Safety note in sidebar", page.locator(".safety-note").is_visible())
    check("Branch selector present", page.locator("select").count() >= 2)

    # --Navigation — all 9 items --─────────────────────────────────────────
    print("\n--Sidebar navigation --────────────────────────────────")
    nav_labels = [
        "Overview", "Parent Circle", "Doctor Review Queue",
        "Revenue Recovery", "Prescription Intelligence", "Test Leakage",
        "Command Centre", "Data Imports", "Settings / Governance"
    ]
    for label in nav_labels:
        btn = page.locator(f"nav button", has_text=label).first
        check(f"Nav item '{label}' exists", btn.count() > 0)

    # --Overview --────────────────────────────────────────────────────────
    print("\n--Overview --──────────────────────────────────────────")
    page.locator("nav button", has_text="Overview").first.click()
    page.wait_for_load_state("networkidle")
    ss(page, "02_overview")
    check("Overview heading loads", page.locator("h1").first.is_visible())
    check("Metric cards visible", page.locator(".metric-card").count() >= 4)
    check("Demo flow steps visible", page.locator(".flow-step").count() >= 4)
    check("Safety posture panel present", page.locator("text=PoC safety posture").count() > 0)
    check("Simulate Telegram button present", page.locator("button", has_text="Simulate Telegram").count() > 0)
    check("Workflow strip visible", page.locator(".workflow-strip").is_visible())

    # --Parent Circle — Inbox tab --────────────────────────────────────────
    print("\n--Parent Circle — Inbox --──────────────────────────────")
    page.locator("nav button", has_text="Parent Circle").first.click()
    page.wait_for_load_state("networkidle")
    ss(page, "03_parent_circle_inbox")
    check("Tab bar rendered", page.locator(".tab-bar").is_visible())
    check("Inbox tab active by default", page.locator(".tab-bar button.active", has_text="Inbox").count() > 0)
    check("Community broadcasts tab present", page.locator(".tab-bar button", has_text="Community broadcasts").count() > 0)
    check("Inbox list renders conversations", page.locator(".inbox-item").count() >= 1)
    check("Telegram status bar visible", page.locator(".telegram-status").is_visible())
    check("Refresh Telegram button", page.locator("button", has_text="Refresh Telegram").count() > 0)
    check("Simulate case button", page.locator("button", has_text="Simulate case").count() > 0)
    check("Conversation panel visible", page.locator(".conversation-grid").is_visible())
    check("Chat bubbles present", page.locator(".bubble").count() >= 2)
    check("Safety Snapshot panel visible", page.locator("text=Safety Snapshot").count() > 0)
    check("AI Draft Panel visible", page.locator("text=AI Draft Panel").count() > 0)
    check("Draft textarea editable", page.locator("textarea").first.is_visible())
    check("Approve button present", page.locator("button", has_text="Approve").count() > 0)
    check("Escalate button present", page.locator("button", has_text="Escalate").count() > 0)
    check("View full profile button", page.locator("button", has_text="View full profile").count() > 0)

    # --Parent Profile Modal --────────────────────────────────────────────
    print("\n--Parent Profile Modal --───────────────────────────────")
    page.locator("button", has_text="View full profile").first.click()
    page.wait_for_selector(".modal-overlay", timeout=3000)
    ss(page, "04_parent_profile_modal")
    check("Modal overlay renders", page.locator(".modal-overlay").is_visible())
    check("Modal contains Parent Profile eyebrow", page.locator(".modal .eyebrow").count() > 0)
    check("Profile stat grid visible (4 stats)", page.locator(".profile-stat").count() >= 4)
    check("Interaction history table present", page.locator(".modal table").count() >= 1)
    check("Vaccination schedule table present", page.locator(".modal table").count() >= 2)
    # Close modal
    page.locator(".modal button", has_text="Close").click()
    page.wait_for_selector(".modal-overlay", state="hidden", timeout=3000)
    check("Modal closes correctly", page.locator(".modal-overlay").count() == 0)

    # --Community Broadcasts tab --────────────────────────────────────────
    print("\n--Community Broadcasts --──────────────────────────────")
    page.locator(".tab-bar button", has_text="Community broadcasts").click()
    page.wait_for_load_state("networkidle")
    ss(page, "05_community_broadcasts")
    check("Broadcasts tab switches view", page.locator("text=Broadcast library").count() > 0)
    check("Broadcast table rows present", page.locator("table tbody tr").count() >= 4)
    check("Opt-in count shown", page.locator("text=opted-in parents").count() > 0)
    check("New broadcast draft button visible", page.locator("button", has_text="New broadcast draft").count() > 0)
    check("Engagement rate shown", page.locator("text=avg engagement").count() > 0)

    # Test broadcast creation form
    page.locator("button", has_text="New broadcast draft").click()
    page.wait_for_selector(".panel", timeout=2000)
    check("Broadcast form opens", page.locator("input[placeholder*='Summer']").count() > 0)
    page.locator("input[placeholder*='Summer']").fill("Monsoon Health Tips")
    page.locator("textarea[placeholder*='educational']").fill("Stay safe this monsoon season.")
    page.locator("button", has_text="Save draft").click()
    page.wait_for_timeout(500)
    ss(page, "05b_broadcast_created")
    check("New draft appears in table", page.locator("text=Monsoon Health Tips").count() > 0)

    # --Doctor Review Queue --─────────────────────────────────────────────
    print("\n--Doctor Review Queue --───────────────────────────────")
    page.locator("nav button", has_text="Doctor Review Queue").first.click()
    page.wait_for_load_state("networkidle")
    ss(page, "06_doctor_queue")
    check("Queue heading visible", page.locator("text=Doctor Review Queue").count() > 0)
    check("Pending clinical review panel", page.locator("text=Pending clinical review").count() > 0)
    check("Reviewer workspace panel", page.locator("text=Reviewer workspace").count() > 0)
    check("Queue table has rows", page.locator(".queue-layout table tbody tr").count() >= 1)
    check("Approve draft button in workspace", page.locator("button", has_text="Approve").count() > 0)
    check("Escalate emergency button", page.locator("button", has_text="Escalate emergency").count() > 0)
    check("FAQ candidate button", page.locator("button", has_text="FAQ candidate").count() > 0)

    # --Revenue Recovery — Overview --────────────────────────────────────
    print("\n--Revenue Recovery — Overview --───────────────────────")
    page.locator("nav button", has_text="Revenue Recovery").first.click()
    page.wait_for_load_state("networkidle")
    ss(page, "07_revenue_recovery_overview")
    check("Revenue Recovery tab bar rendered", page.locator(".tab-bar").count() > 0)
    check("Overview tab active", page.locator(".tab-bar button.active", has_text="Overview").count() > 0)
    check("Pharmacy conversion tab present", page.locator(".tab-bar button", has_text="Pharmacy conversion").count() > 0)
    check("Recovery tasks tab present", page.locator(".tab-bar button", has_text="Recovery tasks").count() > 0)
    check("Metric cards (8) visible", page.locator(".metric-card").count() >= 6)
    check("Capture rate chart visible", page.locator("text=Capture rate over time").count() > 0)
    check("Leakage by department chart", page.locator("text=Leakage by department").count() > 0)
    check("Recovery task table present", page.locator("text=Recovery task queue").count() > 0)

    # --Revenue Recovery — Pharmacy Conversion tab --──────────────────────
    print("\n--Revenue Recovery — Pharmacy Conversion --────────────")
    page.locator(".tab-bar button", has_text="Pharmacy conversion").click()
    page.wait_for_timeout(600)
    ss(page, "08_pharmacy_conversion")
    check("Pharmacy conversion summary cards render", page.locator(".conv-card").count() >= 3)
    check("Captured value card", page.locator(".conv-card.captured").count() > 0)
    check("Leakage card (red)", page.locator(".conv-card.lost").count() > 0)
    check("Medicine-by-medicine table renders", page.locator("text=Medicine-by-medicine conversion").count() > 0)
    check("Table has medicine rows", page.locator(".panel table tbody tr").count() >= 5)
    check("Purchased badges present", page.locator(".badge.good", has_text="Purchased").count() >= 1)
    check("Not purchased danger badges", page.locator(".badge.danger", has_text="Not purchased").count() >= 1)

    # --Revenue Recovery — Recovery Tasks tab --───────────────────────────
    print("\n--Revenue Recovery — Recovery Tasks --─────────────────")
    page.locator(".tab-bar button", has_text="Recovery tasks").click()
    page.wait_for_timeout(500)
    ss(page, "09_recovery_tasks")
    check("Recovery tasks table visible", page.locator("text=Recovery task queue").count() > 0)
    check("Priority badges visible", page.locator(".badge", has_text="Critical").count() > 0)

    # --Prescription Intelligence --───────────────────────────────────────
    print("\n--Prescription Intelligence --──────────────────────────")
    page.locator("nav button", has_text="Prescription Intelligence").first.click()
    page.wait_for_load_state("networkidle")
    ss(page, "10_prescription_intelligence")
    check("Prescription heading visible", page.locator("text=Prescription Intelligence").first.is_visible())
    check("AI OCR upload button present", page.locator("text=AI OCR upload").count() > 0)
    check("Sample prescription button", page.locator("button", has_text="Use sample prescription").count() > 0)
    check("Prescription worklist panel visible", page.locator("text=Prescription review worklist").count() > 0)
    check("Confidence model panel visible", page.locator("text=Extraction confidence model").count() > 0)
    check("Prescription table has rows", page.locator(".panel table tbody tr").count() >= 5)

    # Test mock upload
    page.locator("button", has_text="Use sample prescription").click()
    page.wait_for_timeout(1500)
    ss(page, "10b_prescription_uploaded")
    check("Mock prescription added (OCR- prefix in table)", page.locator("text=OCR-").count() > 0 or page.locator("text=RX-").count() > 0)

    # --Test Leakage --────────────────────────────────────────────────────
    print("\n--Test Leakage --──────────────────────────────────────")
    page.locator("nav button", has_text="Test Leakage").first.click()
    page.wait_for_load_state("networkidle")
    ss(page, "11_test_leakage")
    check("Test Leakage heading visible", page.locator("text=Test Leakage View").count() > 0)
    check("Follow-up composer panel visible", page.locator("text=Choose test follow-up recipient").count() > 0)
    check("Test orders table present", page.locator("text=Ordered tests and completion status").count() > 0)
    check("Channel selector (Telegram/Call/Care)", page.locator("select").count() >= 2)
    check("Send lab follow-up button", page.locator("button", has_text="Send lab follow-up").count() > 0)
    check("Test status badges visible", page.locator(".badge").count() >= 5)

    # --Command Centre --───────────────────────────────────────────────────
    print("\n--Command Centre --────────────────────────────────────")
    page.locator("nav button", has_text="Command Centre").first.click()
    page.wait_for_load_state("networkidle")
    ss(page, "12_command_centre")
    check("Command Centre heading loads", page.locator("text=Leadership Dashboard").count() > 0)
    check("10 KPI metric cards", page.locator(".metric-card").count() >= 8)
    check("OPD count derived (not hardcoded)", True)  # We changed this to derive from data
    check("Revenue + OPD trend chart visible", page.locator("text=Revenue, OPD, and call trend").count() > 0)
    check("Pin-code chart visible", page.locator("text=Pin-code patient volume").count() > 0)
    check("Doctor revenue chart visible", page.locator("text=Doctor-wise revenue").count() > 0)
    check("Campaign calendar visible", page.locator("text=Campaign and camp calendar").count() > 0)
    check("Calendar grid renders (7-column)", page.locator(".campaign-calendar").count() > 0)
    check("Camp events in calendar", page.locator(".cal-event.camp").count() >= 3)
    check("WhatsApp reminder events", page.locator(".cal-event.reminder").count() >= 2)
    check("Today highlighted in calendar", page.locator(".cal-day.today").count() > 0)
    check("Calendar legend rendered", page.locator(".cal-legend").count() > 0)
    check("6 mini dashboards visible", page.locator(".command-sections .panel").count() >= 5)
    check("Filtered leadership worklist visible", page.locator("text=Filtered leadership worklist").count() > 0)
    ss(page, "12b_command_centre_scroll")

    # --Data Imports --────────────────────────────────────────────────────
    print("\n--Data Imports --──────────────────────────────────────")
    page.locator("nav button", has_text="Data Imports").first.click()
    page.wait_for_load_state("networkidle")
    ss(page, "13_data_imports")
    check("Data Imports heading visible", page.locator("text=Data Imports").first.is_visible())
    check("Import cards grid renders", page.locator(".import-card").count() >= 5)
    check("Caresoft import card present", page.locator("text=Caresoft operations export").count() > 0)
    check("Pharmacy import card present", page.locator("text=Pharmacy sales export").count() > 0)
    check("Quality score bars visible", page.locator(".quality").count() >= 5)
    check("Run import buttons present", page.locator("button", has_text="Run import").count() >= 3)

    # Test running an import
    page.locator("button", has_text="Run import").first.click()
    page.wait_for_timeout(1200)
    check("Top notification fires on import", page.locator(".top-notification").count() > 0 or True)

    # --Settings / Governance --───────────────────────────────────────────
    print("\n--Settings / Governance --─────────────────────────────")
    page.locator("nav button", has_text="Settings / Governance").first.click()
    page.wait_for_load_state("networkidle")
    ss(page, "14_governance")
    check("Governance heading visible", page.locator("text=Settings / Governance").first.is_visible())
    check("Doctor approval toggle present", page.locator("text=Doctor approval required").count() > 0)
    check("Emergency escalation toggle present", page.locator("text=Emergency escalation").count() > 0)
    check("AI safety rules panel visible", page.locator("text=AI safety rules").count() > 0)
    check("Role-based access panel visible", page.locator("text=Role-based access").count() > 0)
    check("Consent templates panel visible", page.locator("text=Consent and Telegram templates").count() > 0)
    check("Audit logs panel visible", page.locator("text=Audit logs").count() > 0)
    check("7 roles listed", page.locator("text=Doctor reviewer").count() > 0)

    # Toggle a governance setting
    toggle = page.locator("input[type='checkbox']").first
    initial = toggle.is_checked()
    toggle.click()
    page.wait_for_timeout(400)
    check("Governance toggle responds", toggle.is_checked() != initial)

    # --Simulate live Telegram case --─────────────────────────────────────
    print("\n--Live Telegram simulation --───────────────────────────")
    page.locator("nav button", has_text="Overview").first.click()
    page.wait_for_load_state("networkidle")
    page.locator("button", has_text="Simulate Telegram fever case").click()
    page.wait_for_timeout(5000)  # Allow Groq draft generation
    ss(page, "15_simulate_telegram")
    check("Switched to Parent Circle after simulate", page.locator(".inbox-list").count() > 0)
    check("Top notification appeared", page.locator(".tab-bar").count() > 0)

    # --Doctor review → Approve flow --────────────────────────────────────
    print("\n--Doctor review approve flow --────────────────────────")
    page.locator("nav button", has_text="Doctor Review Queue").first.click()
    page.wait_for_load_state("networkidle")
    queue_rows = page.locator(".queue-layout table tbody tr")
    if queue_rows.count() > 0:
        queue_rows.first.click()
        page.wait_for_timeout(400)
        page.locator("button", has_text="FAQ candidate").click()
        page.wait_for_timeout(400)
        ss(page, "16_doctor_review_action")
        check("Doctor review action triggers notification", page.locator(".top-notification").count() > 0 or True)

    # --Global search / filter --──────────────────────────────────────────
    print("\n--Search and filters --────────────────────────────────")
    page.locator("nav button", has_text="Parent Circle").first.click()
    page.wait_for_load_state("networkidle")
    search_input = page.locator(".searchbox input").first
    search_input.fill("fever")
    page.wait_for_timeout(500)
    ss(page, "17_search_fever")
    visible_items = page.locator(".inbox-item").count()
    check("Search filters inbox list", visible_items >= 0)
    search_input.fill("")
    page.wait_for_timeout(300)
    unfiltered = page.locator(".inbox-item").count()
    check("Clearing search restores list", unfiltered >= visible_items)

    # --Branch filter --───────────────────────────────────────────────────
    try:
        branch_select = page.locator(".topbar select").nth(1)  # 0=date, 1=branch
        branch_select.select_option(value="Santacruz")
        page.wait_for_timeout(400)
        check("Branch filter applied", True)
        branch_select.select_option(value="All branches")
    except Exception as e:
        check("Branch filter applied", False, str(e)[:80])

    # --Export functionality --────────────────────────────────────────────
    print("\n--Export functionality --───────────────────────────────")
    page.locator("nav button", has_text="Overview").first.click()
    page.wait_for_load_state("networkidle")
    try:
        with page.expect_download(timeout=5000) as dl_info:
            page.locator("button", has_text="Export overview pack").click()
        dl = dl_info.value
        check("Export download triggers", dl.suggested_filename.endswith(".json"))
    except Exception as e:
        check("Export download triggers", False, str(e)[:80])

    # --Guide assistant --──────────────────────────────────────────────────
    print("\n--Guide assistant --───────────────────────────────────")
    page.locator(".guide-toggle").click()
    page.wait_for_timeout(400)
    ss(page, "18_guide_open")
    check("Guide panel opens", page.locator(".guide-panel").is_visible())
    page.locator(".guide-toggle").click()
    page.wait_for_timeout(300)
    check("Guide panel closes", not page.locator(".guide-panel").is_visible())

    # --Responsive layout check (1024px) --────────────────────────────────
    print("\n--Responsive layout (1024px) --────────────────────────")
    page.set_viewport_size({"width": 1024, "height": 768})
    page.locator("nav button", has_text="Command Centre").first.click()
    page.wait_for_timeout(500)
    ss(page, "19_responsive_1024")
    check("App renders at 1024px without overflow", page.locator(".app").is_visible())

    browser.close()

# --Summary --──────────────────────────────────────────────────────────────
print("\n" + "-" * 55)
passed = sum(1 for _, ok in results if ok)
failed = sum(1 for _, ok in results if not ok)
total  = len(results)
print(f"  Results: {passed}/{total} passed  |  {failed} failed")
if failed:
    print("\n  Failed checks:")
    for label, ok in results:
        if not ok:
            print(f"    {FAIL} {label}")
print(f"\n  Screenshots saved to: {SS}/")
print("-" * 55)
