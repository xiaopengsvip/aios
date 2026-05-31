import Foundation
import SwiftUI

class AuthManager: ObservableObject {
    @Published var isLoggedIn: Bool = false
    @Published var currentUser: UserInfo? = nil
    
    private let userKey = "aios_user"
    
    init() {
        loadUser()
    }
    
    func loadUser() {
        if let data = UserDefaults.standard.data(forKey: userKey),
           let user = try? JSONDecoder().decode(UserInfo.self, from: data) {
            self.currentUser = user
            self.isLoggedIn = true
        }
    }
    
    func saveUser(_ user: UserInfo) {
        if let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: userKey)
        }
        DispatchQueue.main.async {
            self.currentUser = user
            self.isLoggedIn = true
        }
    }
    
    func logout() {
        UserDefaults.standard.removeObject(forKey: userKey)
        HTTPCookieStorage.shared.cookies?.forEach { HTTPCookieStorage.shared.deleteCookie($0) }
        DispatchQueue.main.async {
            self.currentUser = nil
            self.isLoggedIn = false
        }
    }
}
