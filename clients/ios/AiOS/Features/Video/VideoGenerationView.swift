import SwiftUI
import AVKit

struct VideoGenerationView: View {
    @State private var prompt = ""
    @State private var duration = "5s"
    @State private var resolution = "720p"
    @State private var aspectRatio = "16:9"
    @State private var isGenerating = false
    @State private var videoURLs: [String] = []
    @State private var error: String?
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    TextEditor(text: $prompt)
                        .frame(height: 100)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(.systemGray4)))
                    
                    // Options
                    HStack {
                        Picker("时长", selection: $duration) { Text("3秒").tag("3s"); Text("5秒").tag("5s"); Text("10秒").tag("10s") }
                        Picker("分辨率", selection: $resolution) { Text("480p").tag("480p"); Text("720p").tag("720p"); Text("1080p").tag("1080p") }
                    }
                    .pickerStyle(.segmented)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach([("16:9","横屏"),("9:16","竖屏"),("1:1","方形")], id: \.0) { k, l in
                                Button(l) { aspectRatio = k }
                                    .buttonStyle(.bordered).tint(aspectRatio == k ? .indigo : .gray)
                            }
                        }
                    }
                    
                    Button { generate() } label: {
                        HStack {
                            if isGenerating { ProgressView().tint(.white) }
                            Text(isGenerating ? "生成中... (可能需要1-3分钟)" : "生成视频")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent).tint(.indigo)
                    .disabled(prompt.isEmpty || isGenerating)
                    
                    if let error { Text(error).foregroundColor(.red).font(.caption) }
                    
                    ForEach(videoURLs, id: \.self) { url in
                        if let u = URL(string: url) {
                            VideoPlayer(player: AVPlayer(url: u))
                                .frame(height: 220).cornerRadius(12)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("视频生成")
        }
        .navigationViewStyle(.stack)
    }
    
    func generate() {
        guard !prompt.isEmpty else { return }
        isGenerating = true; error = nil
        Task {
            do {
                let resp: GenerateVideoResponse = try await APIClient.shared.request(
                    "/api/video/generate", method: "POST",
                    body: ["prompt": prompt, "duration": duration, "resolution": resolution, "aspectRatio": aspectRatio]
                )
                if let url = resp.video?.url { videoURLs.insert(url, at: 0) }
            } catch { self.error = error.localizedDescription }
            isGenerating = false
        }
    }
}

struct GenerateVideoResponse: Decodable {
    let video: VideoData?
    struct VideoData: Decodable { let url: String? }
}
