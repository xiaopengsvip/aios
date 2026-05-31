use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to AIOS.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            // Show splash screen while main window loads
            let splash_html = include_str!("../resources/splash.html");
            let splash_win = tauri::WebviewWindowBuilder::new(
                app,
                "splash",
                tauri::WebviewUrl::App(splash_html.into()),
            )
            .title("AIOS")
            .inner_size(800.0, 533.0)
            .center()
            .decorations(false)
            .resizable(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .build()?;

            // Hide main window initially
            let main_win = app.get_webview_window("main").unwrap();
            let _ = main_win.hide();

            // Close splash and show main after a delay
            let splash_handle = splash_win.clone();
            let main_handle = main_win.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_secs(3));
                let _ = main_handle.show();
                let _ = main_handle.set_focus();
                let _ = splash_handle.close();
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
