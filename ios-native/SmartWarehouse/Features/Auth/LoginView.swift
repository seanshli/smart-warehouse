import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var email = ""
    @State private var password = ""
    @State private var showSignUp = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // Logo
                Image(systemName: "cube.box.fill")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 80, height: 80)
                    .foregroundColor(.accentColor)
                
                Text("Smart Warehouse")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("signInToYourAccount".localized)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                // Form
                VStack(spacing: 16) {
                    TextField("email".localized, text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(.roundedBorder)
                    
                    SecureField("password".localized, text: $password)
                        .textContentType(.password)
                        .textFieldStyle(.roundedBorder)
                    
                    if let error = authManager.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                    
                    Button(action: signIn) {
                        if authManager.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("signIn".localized)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(email.isEmpty || password.isEmpty || authManager.isLoading)
                    .frame(maxWidth: .infinity)
                }
                .padding(.horizontal, 32)
                
                Spacer()
                
                // Sign Up Link
                HStack {
                    Text("dontHaveAccount".localized)
                        .foregroundColor(.secondary)
                    Button("signUp".localized) {
                        showSignUp = true
                    }
                }
                .font(.subheadline)
            }
            .padding()
            .sheet(isPresented: $showSignUp) {
                SignUpView()
            }
        }
    }
    
    private func signIn() {
        Task {
            await authManager.signIn(email: email, password: password)
        }
    }
}

struct SignUpView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var invitationCode = ""
    
    var passwordsMatch: Bool {
        !password.isEmpty && password == confirmPassword
    }
    
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("name".localized, text: $name)
                        .textContentType(.name)
                    
                    TextField("email".localized, text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    
                    SecureField("password".localized, text: $password)
                        .textContentType(.newPassword)
                    
                    SecureField("confirmPassword".localized, text: $confirmPassword)
                        .textContentType(.newPassword)
                    
                    if !password.isEmpty && !passwordsMatch {
                        Text("passwordsDoNotMatch".localized)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
                
                Section("joinExistingHousehold".localized) {
                    TextField("invitationCode".localized, text: $invitationCode)
                        .textContentType(.oneTimeCode)
                }
                
                if let error = authManager.errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("signUp".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("cancel".localized) {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("signUp".localized) {
                        signUp()
                    }
                    .disabled(!canSignUp)
                }
            }
        }
    }
    
    private var canSignUp: Bool {
        !name.isEmpty && !email.isEmpty && passwordsMatch && password.count >= 6
    }
    
    private func signUp() {
        Task {
            let success = await authManager.register(
                name: name,
                email: email,
                password: password,
                invitationCode: invitationCode.isEmpty ? nil : invitationCode
            )
            if success {
                dismiss()
            }
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthenticationManager.shared)
}
