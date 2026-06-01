import SwiftUI
import AVKit

struct AudioGenerationView: View {
    @State private var prompt = ""
    @State private var voice = "alloy"
    @State private var isGenerating = false
    @State private var audioURLs: [(url: String, label: String)] = []
    @State private var error: String?
    
    let voices = [("alloy","中性"),("echo","男性"),("fable","叙事"),("onyx","深沉"),("nova","女性"),("shimmer","温柔")]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    TextEditor(text: $prompt)
                        .frame(height: 100)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(.systemGray4)))
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(voices, id: \.0) { k, l in
                                Button(l) { voice = k }
                                    .buttonStyle(.bordered).tint(voice == k ? .indigo : .gray)
                            }
                        }
                    }
                    
                    Button { generate() } label: {
                        HStack {
                            if isGenerating { ProgressView().tint(.white) }
                            Text(isGenerating ? "生成中..." : "生成音频")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent).tint(.indigo)
                    .disabled(prompt.isEmpty || isGenerating)
                    
                    if let error { Text(error).foregroundColor(.red).font(.caption) }
                    
                    ForEach(audioURLs.indices, id: \.self) { i in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(audioURLs[i].label).font(.caption).foregroundColor(.secondary)
                            if let u = URL(string: audioURLs[i].url) {
                                AudioPlayerView(url: u)
                            }
                        }
                        .padding().background(Color(.systemGray6)).cornerRadius(8)
                    }
                }
                .padding()
            }
            .navigationTitle("音频生成")
        }
        .navigationViewStyle(.stack)
    }
    
    func generate() {
        guard !prompt.isEmpty else { return }
        isGenerating = true; error = nil
        Task {
            do {
                let resp: GenerateAudioResponse = try await APIClient.shared.request(
                    "/api/audio/generate", method: "POST",
                    body: ["prompt": prompt, "voice": voice, "format": "mp3"]
                )
                if let url = resp.url { audioURLs.insert((url, String(prompt.prefix(40))), at: 0) }
            } catch { self.error = error.localizedDescription }
            isGenerating = false
        }
    }
}

struct GenerateAudioResponse: Decodable { let url: String? }

struct AudioPlayerView: View {
    let url: URL
    @State private var player: AVPlayer?
    var body: some View {
        HStack {
            Button { player?.play() } label: { Image(systemName: "play.fill").foregroundColor(.indigo) }
            Spacer()
        }
        .onAppear { player = AVPlayer(url: url) }
    }
}
