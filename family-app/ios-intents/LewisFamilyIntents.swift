// Siri + Shortcuts via App Intents (iOS 16+). Each intent calls the /voice Edge Function with the signed-in user's Supabase JWT,
// which the RN app stores in the shared keychain access group "group.com.lewisfamily.app" (see src/lib/supabase.ts).
import AppIntents
import Foundation
import Security

enum LF {
  static let base = Bundle.main.object(forInfoDictionaryKey: "LFSupabaseURL") as? String ?? ""
  static let anon = Bundle.main.object(forInfoDictionaryKey: "LFSupabaseAnon") as? String ?? ""
  static func jwt() -> String? {
    // expo-secure-store saves the Supabase session JSON under this key.
    let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrAccessGroup as String: "group.com.lewisfamily.app",
                            kSecAttrAccount as String: "sb-session", kSecReturnData as String: true, kSecMatchLimit as String: kSecMatchLimitOne]
    var out: AnyObject?; guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let d = out as? Data,
      let j = try? JSONSerialization.jsonObject(with: d) as? [String: Any] else { return nil }
    return j["access_token"] as? String
  }
  static func call(_ body: [String: Any]) async throws -> String {
    guard let token = jwt() else { return "Open the Lewis Family app and sign in first." }
    var r = URLRequest(url: URL(string: base + "/functions/v1/voice")!); r.httpMethod = "POST"
    r.setValue("Bearer " + token, forHTTPHeaderField: "Authorization"); r.setValue(anon, forHTTPHeaderField: "apikey"); r.setValue("application/json", forHTTPHeaderField: "Content-Type")
    r.httpBody = try JSONSerialization.data(withJSONObject: body)
    let (data, _) = try await URLSession.shared.data(for: r)
    return ((try? JSONSerialization.jsonObject(with: data)) as? [String: Any])?["say"] as? String ?? "Something went wrong."
  }
}

struct AddFamilyReminder: AppIntent {
  static var title: LocalizedStringResource = "Add a family reminder"
  @Parameter(title: "Reminder") var task: String
  @Parameter(title: "When", default: nil) var when: String?
  @Parameter(title: "List", default: nil) var list: String?
  static var parameterSummary: some ParameterSummary { Summary("Remind us to \(\.$task) \(\.$when)") }
  func perform() async throws -> some IntentResult & ProvidesDialog {
    .result(dialog: IntentDialog(stringLiteral: try await LF.call(["action": "add_reminder", "title": task, "when": when ?? "", "list": list ?? ""])))
  }
}
struct WhatsToday: AppIntent {
  static var title: LocalizedStringResource = "What’s on today"
  func perform() async throws -> some IntentResult & ProvidesDialog { .result(dialog: IntentDialog(stringLiteral: try await LF.call(["action": "today"]))) }
}
struct DateIdea: AppIntent {
  static var title: LocalizedStringResource = "Give us a date idea"
  @Parameter(title: "For the girls", default: false) var girls: Bool
  func perform() async throws -> some IntentResult & ProvidesDialog { .result(dialog: IntentDialog(stringLiteral: try await LF.call(["action": "date_idea", "kind": girls ? "girls" : "couple"]))) }
}
struct TodaysScripture: AppIntent {
  static var title: LocalizedStringResource = "Today’s Morning Lantern scripture"
  func perform() async throws -> some IntentResult & ProvidesDialog { .result(dialog: IntentDialog(stringLiteral: try await LF.call(["action": "lantern"]))) }
}
struct WhatsForDinner: AppIntent {
  static var title: LocalizedStringResource = "What’s for dinner"
  @Parameter(title: "Meal", default: "dinner") var meal: String
  func perform() async throws -> some IntentResult & ProvidesDialog { .result(dialog: IntentDialog(stringLiteral: try await LF.call(["action": "meal", "meal": meal]))) }
}
struct AddToShoppingList: AppIntent {
  static var title: LocalizedStringResource = "Add to the shopping list"
  @Parameter(title: "Item") var item: String
  static var parameterSummary: some ParameterSummary { Summary("Add \(\.$item) to the shopping list") }
  func perform() async throws -> some IntentResult & ProvidesDialog { .result(dialog: IntentDialog(stringLiteral: try await LF.call(["action": "add_shopping", "title": item]))) }
}
struct AskLewisFamily: AppIntent {
  static var title: LocalizedStringResource = "Ask Lewis Family"
  @Parameter(title: "Question") var question: String
  func perform() async throws -> some IntentResult & ProvidesDialog { .result(dialog: IntentDialog(stringLiteral: try await LF.call(["action": "ask", "question": question]))) }
}

struct LewisFamilyShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(intent: AddFamilyReminder(), phrases: ["Add a reminder in \(.applicationName)", "Add a family reminder in \(.applicationName)"], shortTitle: "Add reminder", systemImageName: "checklist")
    AppShortcut(intent: WhatsToday(), phrases: ["What’s on today in \(.applicationName)", "What’s our day in \(.applicationName)"], shortTitle: "Today", systemImageName: "sun.max")
    AppShortcut(intent: DateIdea(), phrases: ["Give us a date idea in \(.applicationName)", "\(.applicationName) date idea"], shortTitle: "Date idea", systemImageName: "heart")
    AppShortcut(intent: TodaysScripture(), phrases: ["Today’s scripture in \(.applicationName)", "Morning Lantern in \(.applicationName)"], shortTitle: "Scripture", systemImageName: "book")
    AppShortcut(intent: WhatsForDinner(), phrases: ["What’s for dinner in \(.applicationName)", "\(.applicationName) dinner"], shortTitle: "Dinner", systemImageName: "fork.knife")
    AppShortcut(intent: AddToShoppingList(), phrases: ["Add to the shopping list in \(.applicationName)", "\(.applicationName) shopping list"], shortTitle: "Shopping list", systemImageName: "cart")
    AppShortcut(intent: AskLewisFamily(), phrases: ["Ask \(.applicationName)"], shortTitle: "Ask", systemImageName: "bubble.left")
  }
}
