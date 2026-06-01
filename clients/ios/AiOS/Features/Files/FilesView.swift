import SwiftUI

struct FilesView: View {
    @State private var files: [FileItem] = []
    @State private var isLoading = false
    @State private var error: String?
    @State private var showPicker = false
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading { ProgressView() }
                else if files.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "folder").font(.system(size: 48)).foregroundColor(.secondary)
                        Text("暂无文件").font(.headline)
                    }
                } else {
                    List(files) { file in
                        HStack {
                            Image(systemName: fileIcon(file.mimeType))
                                .foregroundColor(.indigo).frame(width: 32)
                            VStack(alignment: .leading) {
                                Text(file.originalName ?? file.name).font(.body)
                                Text("\(formatSize(file.size)) · \(file.mimeType ?? "unknown")")
                                    .font(.caption).foregroundColor(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("文件管理")
            .toolbar {
                Button { showPicker = true } label: { Image(systemName: "plus") }
                Button("刷新") { loadFiles() }
            }
        }
        .navigationViewStyle(.stack)
        .task { loadFiles() }
    }
    
    func loadFiles() {
        isLoading = true
        Task {
            do {
                let resp: FilesResponse = try await APIClient.shared.request("/api/files")
                files = resp.files ?? []
            } catch { self.error = error.localizedDescription }
            isLoading = false
        }
    }
    
    func fileIcon(_ mime: String?) -> String {
        guard let m = mime else { return "doc" }
        if m.contains("image") { return "photo" }
        if m.contains("video") { return "video" }
        if m.contains("audio") { return "music.note" }
        if m.contains("pdf") { return "doc.text" }
        return "doc"
    }
    
    func formatSize(_ bytes: Int) -> String {
        if bytes < 1024 { return "\(bytes)B" }
        if bytes < 1048576 { return String(format: "%.1fKB", Double(bytes)/1024) }
        return String(format: "%.1fMB", Double(bytes)/1048576)
    }
}

struct FilesResponse: Decodable { let files: [FileItem]? }
struct FileItem: Decodable, Identifiable {
    let id: String
    let name: String
    let originalName: String?
    let size: Int
    let mimeType: String?
}
