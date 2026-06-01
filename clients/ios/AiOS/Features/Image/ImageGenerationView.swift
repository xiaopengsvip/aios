import SwiftUI

struct ImageGenerationView: View {
    @State private var prompt = ""
    @State private var style = "realistic"
    @State private var isGenerating = false
    @State private var generatedURLs: [String] = []
    @State private var error: String?
    
    let styles = [("realistic","写实"),("anime","动漫"),("oil","油画"),("watercolor","水彩"),("sketch","素描")]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Prompt
                    TextEditor(text: $prompt)
                        .frame(height: 100)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(.systemGray4)))
                    
                    // Styles
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(styles, id: \.0) { key, label in
                                Button(label) { style = key }
                                    .buttonStyle(.bordered)
                                    .tint(style == key ? .indigo : .gray)
                            }
                        }
                    }
                    
                    // Generate
                    Button { generate() } label: {
                        HStack {
                            if isGenerating { ProgressView().tint(.white) }
                            Text(isGenerating ? "生成中..." : "生成图片")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.indigo)
                    .disabled(prompt.isEmpty || isGenerating)
                    
                    if let error { Text(error).foregroundColor(.red).font(.caption) }
                    
                    // Results
                    ForEach(generatedURLs, id: \.self) { url in
                        AsyncImage(url: URL(string: url)) { image in
                            image.resizable().aspectRatio(contentMode: .fit)
                                .cornerRadius(12)
                        } placeholder: {
                            RoundedRectangle(cornerRadius: 12).fill(Color(.systemGray5)).frame(height: 200)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("AI 绘图")
        }
        .navigationViewStyle(.stack)
    }
    
    func generate() {
        guard !prompt.isEmpty else { return }
        isGenerating = true; error = nil
        Task {
            do {
                let resp: GenerateImageResponse = try await APIClient.shared.request(
                    "/api/images/generate", method: "POST",
                    body: ["prompt": prompt, "style": style, "size": "1024x1024"]
                )
                if let url = resp.url { generatedURLs.insert(url, at: 0) }
            } catch { self.error = error.localizedDescription }
            isGenerating = false
        }
    }
}

struct GenerateImageResponse: Decodable { let url: String? }
