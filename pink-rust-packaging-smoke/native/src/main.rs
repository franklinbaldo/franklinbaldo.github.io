use std::{env, process};

const VERSION: &str = env!("CARGO_PKG_VERSION");

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();

    if args.iter().any(|arg| matches!(arg.as_str(), "--version" | "-V")) {
        println!("pink {VERSION}");
        return;
    }

    let command = args.iter().find(|arg| !arg.starts_with('-')).map(String::as_str);
    let json = args.iter().any(|arg| arg == "--json");

    match command {
        Some("packaging-smoke") if json => {
            println!(
                "{{\"package\":\"pink\",\"executable\":\"pink\",\"runtime\":\"rust\",\"version\":\"{VERSION}\"}}"
            );
        }
        Some("packaging-smoke") => println!("pink {VERSION} (rust packaging probe)"),
        _ => {
            eprintln!("Pink native packaging probe: use --version or packaging-smoke --json");
            process::exit(2);
        }
    }
}
