use pnet::datalink;
use users::get_current_uid;
use users::get_user_by_uid;
use users::os::unix::UserExt;

pub fn run() {
    println!("=== Сетевые интерфейсы (группа 478) ===");
    println!();

    let interfaces = datalink::interfaces();
    let mut primary: Option<(String, String)> = None;

    for iface in &interfaces {
        println!("Интерфейс: {}", iface.name);

        for ip in &iface.ips {
            let family = if ip.is_ipv4() { "IPv4" } else { "IPv6" };
            println!("  {}: {}", family, ip.ip());

            if ip.is_ipv4() && !ip.ip().is_loopback() && primary.is_none() {
                primary = Some((iface.name.clone(), ip.ip().to_string()));
            }
        }

        if let Some(mac) = iface.mac {
            let masked = mask_mac(&mac.to_string());
            println!("  MAC: {}", masked);
        }

        println!();
    }

    print!("=== Основной интерфейс ===");
    match primary {
        Some((name, ip)) => println!("{} ({})", name, ip),
        None => println!("Не найден"),
    }
    println!();

    println!("=== Информация о пользователе ===");
    let uid = get_current_uid();

    match get_user_by_uid(uid) {
        Some(user) => {
            println!("Имя: {}", user.name().to_string_lossy());
            println!("UID: {}", user.uid());
            println!("GID: {}", user.primary_group_id());
            println!("Домашняя директория: {}", user.home_dir().to_string_lossy());
            println!("Оболочка: {}", user.shell().to_string_lossy());
        }
        None => println!("Не удалось получить пользователя"),
    }

    println!();
    if uid == 0 {
        println!("⚠ Вы работаете от root!");
    } else {
        println!("Проверка root: нет");
    }
}

fn mask_mac(mac: &str) -> String {
    let parts: Vec<&str> = mac.split(':').collect();
    if parts.len() != 6 {
        return mac.to_string();
    }
    format!("{}:{}:{}:****:****", parts[0], parts[1], parts[2])
}
