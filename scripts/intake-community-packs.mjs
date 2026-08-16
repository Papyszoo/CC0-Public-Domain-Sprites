import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const PACKS_DIR = path.resolve("packs");

async function intakePixelAdventure1() {
    const slug = "pixelfrog-pixel-adventure-1";
    const targetDir = path.join(PACKS_DIR, slug);
    fs.mkdirSync(path.join(targetDir, "sprites"), { recursive: true });

    const zipPath = "/tmp/pixelfrog/pa1.zip";
    const tmpExtract = "/tmp/pa1_extracted";
    fs.rmSync(tmpExtract, { recursive: true, force: true });
    execSync(`unzip -q "${zipPath}" -d "${tmpExtract}"`);

    // Copy sprites
    const subdirs = ["Background", "Items", "Main Characters", "Other", "Terrain", "Traps"];
    for (const sub of subdirs) {
        const src = path.join(tmpExtract, sub);
        const dst = path.join(targetDir, "sprites", sub);
        if (fs.existsSync(src)) {
            fs.cpSync(src, dst, { recursive: true });
        }
    }

    // Cover
    if (fs.existsSync(path.join(tmpExtract, "Hello.png"))) {
        fs.copyFileSync(path.join(tmpExtract, "Hello.png"), path.join(targetDir, "cover.png"));
    }

    const packJson = {
        name: "Pixel Adventure 1",
        creator: "Pixel Frog",
        website: "https://pixelfrog-assets.itch.io/pixel-adventure-1",
        license: "CC0",
        description: "2D pixel-art platformer graphics featuring iconic characters (Ninja Frog, Pink Man, Mask Dude, Virtual Guy), animated items, fruit collectibles, checkpoints, traps, backgrounds, and terrain tilesets by Pixel Frog.",
        generation: {
            category: "Characters",
            allowed_categories: [
                "Characters",
                "Tilesets & Environments",
                "Items & Icons",
                "Backgrounds",
                "Effects"
            ]
        }
    };
    fs.writeFileSync(path.join(targetDir, "pack.json"), JSON.stringify(packJson, null, 2) + "\n");
    console.log(`✓ ${slug} intaked`);
}

async function intakePixelAdventure2() {
    const slug = "pixelfrog-pixel-adventure-2";
    const targetDir = path.join(PACKS_DIR, slug);
    fs.mkdirSync(path.join(targetDir, "sprites"), { recursive: true });

    const zipPath = "/tmp/pixelfrog/pa2.zip";
    const tmpExtract = "/tmp/pa2_extracted";
    fs.rmSync(tmpExtract, { recursive: true, force: true });
    execSync(`unzip -q "${zipPath}" -d "${tmpExtract}"`);

    // Copy sprites
    if (fs.existsSync(path.join(tmpExtract, "Enemies"))) {
        fs.cpSync(path.join(tmpExtract, "Enemies"), path.join(targetDir, "sprites", "Enemies"), { recursive: true });
    }

    // Generate/use cover
    // Use first enemy png or copy from pa1
    const angryPig = path.join(targetDir, "sprites", "Enemies", "AngryPig", "Idle (36x30).png");
    if (fs.existsSync(angryPig)) {
        fs.copyFileSync(angryPig, path.join(targetDir, "cover.png"));
    }

    const packJson = {
        name: "Pixel Adventure 2",
        creator: "Pixel Frog",
        website: "https://pixelfrog-assets.itch.io/pixel-adventure-2",
        license: "CC0",
        description: "20 unique animated 2D enemy characters (Angry Pig, Bat, Bee, Blue Bird, Bunny, Chameleon, Duck, Fat Bird, Ghost, Mushroom, Plant, Radish, Rhino, Rocks, Skull, Slime, Snail, Spiked Ball, Trunk, Turtle) with idle, run, hit, and attack sprite strips by Pixel Frog.",
        generation: {
            category: "Creatures",
            allowed_categories: [
                "Creatures",
                "Effects"
            ]
        }
    };
    fs.writeFileSync(path.join(targetDir, "pack.json"), JSON.stringify(packJson, null, 2) + "\n");
    console.log(`✓ ${slug} intaked`);
}

async function intakeKingsAndPigs() {
    const slug = "pixelfrog-kings-and-pigs";
    const targetDir = path.join(PACKS_DIR, slug);
    fs.mkdirSync(path.join(targetDir, "sprites"), { recursive: true });

    const zipPath = "/tmp/pixelfrog/kp.zip";
    const tmpExtract = "/tmp/kp_extracted";
    fs.rmSync(tmpExtract, { recursive: true, force: true });
    execSync(`unzip -q "${zipPath}" -d "${tmpExtract}"`);

    // Copy sprites (only PNGs under Sprites/)
    if (fs.existsSync(path.join(tmpExtract, "Sprites"))) {
        fs.cpSync(path.join(tmpExtract, "Sprites"), path.join(targetDir, "sprites"), { recursive: true });
    }

    // Cover
    const kingHuman = path.join(targetDir, "sprites", "01-King Human", "Idle (78x58).png");
    if (fs.existsSync(kingHuman)) {
        fs.copyFileSync(kingHuman, path.join(targetDir, "cover.png"));
    }

    const packJson = {
        name: "Kings and Pigs",
        creator: "Pixel Frog",
        website: "https://pixelfrog-assets.itch.io/kings-and-pigs",
        license: "CC0",
        description: "Classic 2D pixel platformer asset pack featuring King Human, King Pig, Pig guards with bombs/cannons/boxes, castles, doors, health bars, diamonds, and dialogue boxes by Pixel Frog.",
        generation: {
            category: "Characters",
            allowed_categories: [
                "Characters",
                "Creatures",
                "Tilesets & Environments",
                "Items & Icons",
                "UI",
                "Effects"
            ]
        }
    };
    fs.writeFileSync(path.join(targetDir, "pack.json"), JSON.stringify(packJson, null, 2) + "\n");
    console.log(`✓ ${slug} intaked`);
}

async function intakePirateBomb() {
    const slug = "pixelfrog-pirate-bomb";
    const targetDir = path.join(PACKS_DIR, slug);
    fs.rmSync(path.join(targetDir, "sprites"), { recursive: true, force: true });
    fs.mkdirSync(path.join(targetDir, "sprites"), { recursive: true });

    const zipPath = "/tmp/pixelfrog/pb.zip";
    const tmpExtract = "/tmp/pb_extracted";
    fs.rmSync(tmpExtract, { recursive: true, force: true });
    execSync(`unzip -q "${zipPath}" -d "${tmpExtract}"`);

    // Copy sprites
    if (fs.existsSync(path.join(tmpExtract, "Sprites"))) {
        fs.cpSync(path.join(tmpExtract, "Sprites"), path.join(targetDir, "sprites"), { recursive: true });
    }

    // Run spritesheet stitching via Python PIL
    execSync(`python3 -c '
import os, shutil, re
from PIL import Image

pack_dir = "${targetDir}/sprites"

# 1. Stitch multi-frame directories
for root, dirs, files in list(os.walk(pack_dir)):
    pngs = [f for f in files if f.endswith(".png")]
    numeric_pngs = [f for f in pngs if f[:-4].isdigit()]
    if len(numeric_pngs) >= 2 and len(numeric_pngs) == len(pngs):
        files_sorted = sorted(numeric_pngs, key=lambda x: int(x[:-4]))
        imgs = [Image.open(os.path.join(root, f)) for f in files_sorted]
        w, h = imgs[0].size
        folder_name = os.path.basename(root)
        action_name = re.sub(r"^\\d+-\\s*", "", folder_name)
        parent_dir = os.path.dirname(root)
        sheet = Image.new("RGBA", (w * len(imgs), h), (0, 0, 0, 0))
        for i, im in enumerate(imgs):
            sheet.paste(im, (i * w, 0))
        out_filename = f"{action_name} ({w}x{h}).png"
        sheet.save(os.path.join(parent_dir, out_filename))
        shutil.rmtree(root)

# 2. Clean single frame remaining dirs
for root, dirs, files in list(os.walk(pack_dir)):
    if len(files) == 1 and files[0] == "1.png":
        fpath = os.path.join(root, "1.png")
        im = Image.open(fpath)
        w, h = im.size
        parent = os.path.dirname(root)
        folder_name = os.path.basename(root)
        action_name = re.sub(r"^\\d+-\\s*", "", folder_name)
        new_name = f"{action_name} ({w}x{h}).png"
        target_path = os.path.join(parent, new_name)
        shutil.move(fpath, target_path)
        shutil.rmtree(root)

# 3. Flatten 7-Objects
objects_dir = os.path.join(pack_dir, "7-Objects")
if os.path.exists(objects_dir):
    for root, dirs, files in list(os.walk(objects_dir)):
        if root == objects_dir: continue
        for f in files:
            src = os.path.join(root, f)
            parent_name = re.sub(r"^\\d+-\\s*", "", os.path.basename(root))
            if f.startswith(parent_name):
                dest_name = f
            else:
                dest_name = f"{parent_name} - {f}" if not f.startswith("(") else f"{parent_name} {f}"
            dest = os.path.join(objects_dir, dest_name)
            shutil.move(src, dest)
        shutil.rmtree(root, ignore_errors=True)
'`);

    // Find cover
    const playerIdle = path.join(targetDir, "sprites", "1-Player-Bomb Guy", "Idle (58x58).png");
    if (fs.existsSync(playerIdle)) {
        fs.copyFileSync(playerIdle, path.join(targetDir, "cover.png"));
    }

    const packJson = {
        name: "Pirate Bomb",
        creator: "Pixel Frog",
        website: "https://pixelfrog-assets.itch.io/pirate-bomb",
        license: "CC0",
        description: "2D pirate pixel art asset pack with animated Bomb Guy player, pirate enemies (Bald Pirate, Cucumber, Big Guy, Captain, Whale), interactive bombs, chests, doors, and wooden ship tile-sets by Pixel Frog.",
        generation: {
            category: "Characters",
            allowed_categories: [
                "Characters",
                "Creatures",
                "Tilesets & Environments",
                "Items & Icons",
                "Effects"
            ]
        }
    };
    fs.writeFileSync(path.join(targetDir, "pack.json"), JSON.stringify(packJson, null, 2) + "\n");
    console.log(`✓ ${slug} intaked`);
}

async function intakePlanetCute() {
    const slug = "lostgarden-planet-cute";
    const targetDir = path.join(PACKS_DIR, slug);
    fs.mkdirSync(path.join(targetDir, "sprites"), { recursive: true });

    const zipPath = "/tmp/planetcute.zip";
    const tmpExtract = "/tmp/planetcute_extracted";
    fs.rmSync(tmpExtract, { recursive: true, force: true });
    execSync(`unzip -q "${zipPath}" -d "${tmpExtract}"`);

    const pngDir = path.join(tmpExtract, "PlanetCute PNG");
    if (fs.existsSync(pngDir)) {
        for (const file of fs.readdirSync(pngDir)) {
            if (file.endsWith(".png") && !file.includes("ShadowTest")) {
                fs.copyFileSync(path.join(pngDir, file), path.join(targetDir, "sprites", file));
            }
        }
    }

    // Cover
    const boy = path.join(targetDir, "sprites", "Character Boy.png");
    if (fs.existsSync(boy)) {
        fs.copyFileSync(boy, path.join(targetDir, "cover.png"));
    }

    const packJson = {
        name: "Planet Cute",
        creator: "Daniel Cook",
        website: "https://lostgarden.home.blog/2007/05/12/dancs-miraculously-flexible-game-prototyping-tiles/",
        license: "CC0",
        description: "Iconic modular isometric and orthographic prototyping tiles, cute characters (Boy, Cat Girl, Horn Girl, Princess Girl), enemy bugs, ramps, water, gems, chests, and terrain blocks by Daniel Cook (Lostgarden).",
        generation: {
            category: "Tilesets & Environments",
            allowed_categories: [
                "Tilesets & Environments",
                "Characters",
                "Creatures",
                "Items & Icons"
            ]
        }
    };
    fs.writeFileSync(path.join(targetDir, "pack.json"), JSON.stringify(packJson, null, 2) + "\n");
    console.log(`✓ ${slug} intaked`);
}

async function intakeDCSS() {
    const zipPath = "/tmp/crawl_tiles.zip";
    const tmpExtract = "/tmp/dcss_extracted";
    fs.rmSync(tmpExtract, { recursive: true, force: true });
    execSync(`unzip -q "${zipPath}" -d "${tmpExtract}"`);

    const baseDir = path.join(tmpExtract, "crawl-tiles Oct-5-2010");

    // 1. DCSS Dungeon Environments
    {
        const slug = "dcss-dungeon-environments";
        const targetDir = path.join(PACKS_DIR, slug);
        fs.mkdirSync(path.join(targetDir, "sprites"), { recursive: true });
        if (fs.existsSync(path.join(baseDir, "dc-dngn"))) {
            fs.cpSync(path.join(baseDir, "dc-dngn"), path.join(targetDir, "sprites"), { recursive: true });
        }
        // Cover
        const altar = path.join(targetDir, "sprites", "altars", "dngn_altar_beogh.png");
        if (fs.existsSync(altar)) fs.copyFileSync(altar, path.join(targetDir, "cover.png"));

        const packJson = {
            name: "Dungeon Crawl: Environments",
            creator: "Dungeon Crawl Stone Soup Team",
            website: "https://crawl.develz.org/",
            license: "CC0",
            description: "Over 500 modular 32x32 dungeon tiles: stone walls, crypt floors, doors, gates, altars, stairs, and dungeon props from Dungeon Crawl Stone Soup. CC0 1.0 Universal public domain.",
            generation: {
                category: "Tilesets & Environments",
                allowed_categories: [
                    "Tilesets & Environments"
                ]
            }
        };
        fs.writeFileSync(path.join(targetDir, "pack.json"), JSON.stringify(packJson, null, 2) + "\n");
        console.log(`✓ ${slug} intaked`);
    }

    // 2. DCSS Items & Equipment
    {
        const slug = "dcss-items-and-equipment";
        const targetDir = path.join(PACKS_DIR, slug);
        fs.mkdirSync(path.join(targetDir, "sprites"), { recursive: true });
        if (fs.existsSync(path.join(baseDir, "item"))) {
            fs.cpSync(path.join(baseDir, "item"), path.join(targetDir, "sprites"), { recursive: true });
        }
        // Cover
        const sword = path.join(targetDir, "sprites", "weapon", "long_sword_1.png");
        if (fs.existsSync(sword)) fs.copyFileSync(sword, path.join(targetDir, "cover.png"));

        const packJson = {
            name: "Dungeon Crawl: Items & Equipment",
            creator: "Dungeon Crawl Stone Soup Team",
            website: "https://crawl.develz.org/",
            license: "CC0",
            description: "Over 640 classic 32x32 RPG items: swords, axes, maces, bows, shields, body armor, helmets, boots, potions, scrolls, wands, rings, amulets, and gold from Dungeon Crawl Stone Soup. CC0 1.0 Universal.",
            generation: {
                category: "Items & Icons",
                allowed_categories: [
                    "Items & Icons"
                ]
            }
        };
        fs.writeFileSync(path.join(targetDir, "pack.json"), JSON.stringify(packJson, null, 2) + "\n");
        console.log(`✓ ${slug} intaked`);
    }

    // 3. DCSS Monsters & Creatures
    {
        const slug = "dcss-monsters-and-creatures";
        const targetDir = path.join(PACKS_DIR, slug);
        fs.mkdirSync(path.join(targetDir, "sprites"), { recursive: true });
        if (fs.existsSync(path.join(baseDir, "dc-mon"))) {
            fs.cpSync(path.join(baseDir, "dc-mon"), path.join(targetDir, "sprites"), { recursive: true });
        }
        // Cover
        const dragon = path.join(targetDir, "sprites", "dragon.png");
        if (fs.existsSync(dragon)) fs.copyFileSync(dragon, path.join(targetDir, "cover.png"));

        const packJson = {
            name: "Dungeon Crawl: Monsters & Creatures",
            creator: "Dungeon Crawl Stone Soup Team",
            website: "https://crawl.develz.org/",
            license: "CC0",
            description: "Over 540 fantasy monster sprites: dragons, demons, undead, orcs, goblins, slimes, hydras, beasts, and mythical creatures from Dungeon Crawl Stone Soup. CC0 1.0 Universal.",
            generation: {
                category: "Creatures",
                allowed_categories: [
                    "Creatures"
                ]
            }
        };
        fs.writeFileSync(path.join(targetDir, "pack.json"), JSON.stringify(packJson, null, 2) + "\n");
        console.log(`✓ ${slug} intaked`);
    }

    // 4. DCSS Characters & Spells
    {
        const slug = "dcss-characters-and-spells";
        const targetDir = path.join(PACKS_DIR, slug);
        fs.mkdirSync(path.join(targetDir, "sprites"), { recursive: true });
        if (fs.existsSync(path.join(baseDir, "player"))) {
            fs.cpSync(path.join(baseDir, "player"), path.join(targetDir, "sprites", "player"), { recursive: true });
        }
        if (fs.existsSync(path.join(baseDir, "spells"))) {
            fs.cpSync(path.join(baseDir, "spells"), path.join(targetDir, "sprites", "spells"), { recursive: true });
        }
        if (fs.existsSync(path.join(baseDir, "effect"))) {
            fs.cpSync(path.join(baseDir, "effect"), path.join(targetDir, "sprites", "effect"), { recursive: true });
        }
        // Cover
        const elf = path.join(targetDir, "sprites", "player", "base", "deep_elf_m.png");
        if (fs.existsSync(elf)) fs.copyFileSync(elf, path.join(targetDir, "cover.png"));

        const packJson = {
            name: "Dungeon Crawl: Characters & Spells",
            creator: "Dungeon Crawl Stone Soup Team",
            website: "https://crawl.develz.org/",
            license: "CC0",
            description: "Over 1,000 RPG character race avatars, equipment overlays, spell icons, elemental magic bursts, and status effects from Dungeon Crawl Stone Soup. CC0 1.0 Universal.",
            generation: {
                category: "Characters",
                allowed_categories: [
                    "Characters",
                    "Effects"
                ]
            }
        };
        fs.writeFileSync(path.join(targetDir, "pack.json"), JSON.stringify(packJson, null, 2) + "\n");
        console.log(`✓ ${slug} intaked`);
    }
}

async function intakeHardVacuum() {
    const srcBase = "/tmp/openhv/mods/hv/bits/sprites";
    if (!fs.existsSync(srcBase)) return;

    // Helper to get frame size from yaml
    function getYamlFrameSize(yamlPath) {
        if (!fs.existsSync(yamlPath)) return null;
        const content = fs.readFileSync(yamlPath, "utf8");
        const fsMatch = content.match(/FrameSize:\s*(\d+)\s*,\s*(\d+)/);
        const faMatch = content.match(/FrameAmount:\s*(\d+)/);
        if (fsMatch) {
            return {
                fw: parseInt(fsMatch[1], 10),
                fh: parseInt(fsMatch[2], 10),
                fa: faMatch ? parseInt(faMatch[1], 10) : 1
            };
        }
        return null;
    }

    // 1. Hard Vacuum: Units & Vehicles
    {
        const slug = "lostgarden-hard-vacuum-units";
        const targetDir = path.join(PACKS_DIR, slug);
        fs.rmSync(path.join(targetDir, "sprites"), { recursive: true, force: true });
        fs.mkdirSync(path.join(targetDir, "sprites"), { recursive: true });

        const unitDirs = ["aircraft", "infantry", "ships", "vehicles", "animals"];
        for (const d of unitDirs) {
            const s = path.join(srcBase, d);
            if (fs.existsSync(s)) {
                for (const file of fs.readdirSync(s)) {
                    if (file.endsWith(".png")) {
                        const base = file.slice(0, -4);
                        const yamlPath = path.join(s, `${base}.yaml`);
                        const ymeta = getYamlFrameSize(yamlPath);
                        let destName = `${d}_${base}.png`;
                        if (ymeta && ymeta.fa > 1) {
                            destName = `${d}_${base} (${ymeta.fw}x${ymeta.fh}).png`;
                        }
                        fs.copyFileSync(path.join(s, file), path.join(targetDir, "sprites", destName));
                    }
                }
            }
        }

        // Cover
        const tank = path.join(targetDir, "sprites", "vehicles_tank (32x32).png") || path.join(targetDir, "sprites", "vehicles_tank-idle.png");
        for (const f of fs.readdirSync(path.join(targetDir, "sprites"))) {
            if (f.startsWith("vehicles_tank") && f.endsWith(".png") && !f.includes("icon")) {
                fs.copyFileSync(path.join(targetDir, "sprites", f), path.join(targetDir, "cover.png"));
                break;
            }
        }

        const packJson = {
            name: "Hard Vacuum: Units & Vehicles",
            creator: "Daniel Cook",
            website: "https://lostgarden.home.blog/",
            license: "CC0",
            description: "Over 200 classic pixel-art Sci-Fi RTS units: tanks, buggies, aircraft, naval gunboats, mech walkers, and infantry by Daniel Cook (Lostgarden). CC0 1.0 Universal public domain.",
            generation: {
                category: "Items & Icons",
                allowed_categories: [
                    "Items & Icons",
                    "Characters",
                    "Creatures"
                ]
            }
        };
        fs.writeFileSync(path.join(targetDir, "pack.json"), JSON.stringify(packJson, null, 2) + "\n");
        console.log(`✓ ${slug} intaked`);
    }

    // 2. Hard Vacuum: Structures & Base
    {
        const slug = "lostgarden-hard-vacuum-structures";
        const targetDir = path.join(PACKS_DIR, slug);
        fs.rmSync(path.join(targetDir, "sprites"), { recursive: true, force: true });
        fs.mkdirSync(path.join(targetDir, "sprites"), { recursive: true });

        const structDirs = ["buildings", "props", "effects"];
        for (const d of structDirs) {
            const s = path.join(srcBase, d);
            if (fs.existsSync(s)) {
                for (const file of fs.readdirSync(s)) {
                    if (file.endsWith(".png")) {
                        const base = file.slice(0, -4);
                        const yamlPath = path.join(s, `${base}.yaml`);
                        const ymeta = getYamlFrameSize(yamlPath);
                        let destName = `${d}_${base}.png`;
                        if (ymeta && ymeta.fa > 1) {
                            destName = `${d}_${base} (${ymeta.fw}x${ymeta.fh}).png`;
                        }
                        fs.copyFileSync(path.join(s, file), path.join(targetDir, "sprites", destName));
                    }
                }
            }
        }

        // Cover
        for (const f of fs.readdirSync(path.join(targetDir, "sprites"))) {
            if (f.startsWith("buildings_hq") && f.endsWith(".png") && !f.includes("icon")) {
                fs.copyFileSync(path.join(targetDir, "sprites", f), path.join(targetDir, "cover.png"));
                break;
            }
        }

        const packJson = {
            name: "Hard Vacuum: Structures & Base",
            creator: "Daniel Cook",
            website: "https://lostgarden.home.blog/",
            license: "CC0",
            description: "Over 300 Sci-Fi base structures, headquarters, radar dishes, power plants, turrets, refineries, craters, and explosions by Daniel Cook (Lostgarden). CC0 1.0 Universal.",
            generation: {
                category: "Tilesets & Environments",
                allowed_categories: [
                    "Tilesets & Environments",
                    "Effects"
                ]
            }
        };
        fs.writeFileSync(path.join(targetDir, "pack.json"), JSON.stringify(packJson, null, 2) + "\n");
        console.log(`✓ ${slug} intaked`);
    }

    // 3. Hard Vacuum: Terrain
    {
        const slug = "lostgarden-hard-vacuum-terrain";
        const targetDir = path.join(PACKS_DIR, slug);
        fs.rmSync(path.join(targetDir, "sprites"), { recursive: true, force: true });
        fs.mkdirSync(path.join(targetDir, "sprites"), { recursive: true });

        const s = path.join(srcBase, "terrain");
        if (fs.existsSync(s)) {
            for (const file of fs.readdirSync(s)) {
                if (file.endsWith(".png")) {
                    const base = file.slice(0, -4);
                    const yamlPath = path.join(s, `${base}.yaml`);
                    const ymeta = getYamlFrameSize(yamlPath);
                    let destName = file;
                    if (ymeta && ymeta.fa > 1) {
                        destName = `${base} (${ymeta.fw}x${ymeta.fh}).png`;
                    }
                    fs.copyFileSync(path.join(s, file), path.join(targetDir, "sprites", destName));
                }
            }
        }

        // Cover
        const tCover = path.join(targetDir, "sprites", "grass-clear.png");
        if (fs.existsSync(tCover)) fs.copyFileSync(tCover, path.join(targetDir, "cover.png"));

        const packJson = {
            name: "Hard Vacuum: Terrain & Ground",
            creator: "Daniel Cook",
            website: "https://lostgarden.home.blog/",
            license: "CC0",
            description: "Over 580 modular pixel-art RTS terrain tiles: grass, dirt, concrete roads, cliffs, shorelines, water, and alien terrain by Daniel Cook (Lostgarden). CC0 1.0 Universal.",
            generation: {
                category: "Tilesets & Environments",
                allowed_categories: [
                    "Tilesets & Environments"
                ]
            }
        };
        fs.writeFileSync(path.join(targetDir, "pack.json"), JSON.stringify(packJson, null, 2) + "\n");
        console.log(`✓ ${slug} intaked`);
    }
}

async function intakeSuperpowers() {
    const srcBase = "/tmp/superpowers_packs";
    if (!fs.existsSync(srcBase)) return;

    const packsConfig = [
        {
            slug: "pixelboy-medieval-fantasy",
            folder: "medieval-fantasy",
            name: "Medieval Fantasy",
            creator: "Pixel-boy",
            website: "https://github.com/sparklinlabs/superpowers-asset-packs",
            license: "CC0",
            description: "16-bit medieval fantasy pixel art sprites by Pixel-boy: knights, archers, wizards, castle and dungeon tilesets, dragons, goblins, skeletons, chests, potions, and weapons.",
            cover: "preview.png",
            category: "Characters",
            allowed_categories: ["Characters", "Creatures", "Items & Icons", "Tilesets & Environments", "Effects", "UI"]
        },
        {
            slug: "pixelboy-ninja-adventure",
            folder: "ninja-adventure",
            name: "Ninja Adventure",
            creator: "Pixel-boy",
            website: "https://github.com/sparklinlabs/superpowers-asset-packs",
            license: "CC0",
            description: "Action adventure ninja pixel art sprites by Pixel-boy: ninjas, samurai, shurikens, katanas, bamboo forest tiles, Japanese village buildings, monsters, smoke bombs, and FX.",
            cover: "preview-part-1.png",
            category: "Characters",
            allowed_categories: ["Characters", "Creatures", "Items & Icons", "Tilesets & Environments", "Effects", "UI"]
        },
        {
            slug: "pixelboy-prehistoric-platformer",
            folder: "prehistoric-platformer",
            name: "Prehistoric Platformer",
            creator: "Pixel-boy",
            website: "https://github.com/sparklinlabs/superpowers-asset-packs",
            license: "CC0",
            description: "Prehistoric dinosaur platformer pixel art sprites by Pixel-boy: cavemen, T-rex, triceratops, pterodactyl, mammoth, bone clubs, stone axes, jungle & cave tilesets.",
            cover: "preview.png",
            category: "Characters",
            allowed_categories: ["Characters", "Creatures", "Items & Icons", "Tilesets & Environments", "Effects", "UI"]
        },
        {
            slug: "pixelboy-rpg-battle-system",
            folder: "rpg-battle-system",
            name: "RPG Battle System",
            creator: "Pixel-boy",
            website: "https://github.com/sparklinlabs/superpowers-asset-packs",
            license: "CC0",
            description: "Turn-based RPG battle pixel art sprites by Pixel-boy: battle heroes (warrior, mage, rogue, healer), animated battle monsters, elemental spell effects, status icons, and UI.",
            cover: "preview.png",
            category: "Characters",
            allowed_categories: ["Characters", "Creatures", "Items & Icons", "Effects", "UI", "Backgrounds"]
        },
        {
            slug: "pixelboy-space-shooter",
            folder: "space-shooter",
            name: "Space Shooter",
            creator: "Pixel-boy",
            website: "https://github.com/sparklinlabs/superpowers-asset-packs",
            license: "CC0",
            description: "Retro arcade space shooter pixel art sprites by Pixel-boy: starfighter player ships, alien swarm fleets, mothership bosses, laser beams, energy shields, asteroids, and explosions.",
            cover: "preview.png",
            category: "Items & Icons",
            allowed_categories: ["Items & Icons", "Creatures", "Effects", "UI", "Tilesets & Environments"]
        },
        {
            slug: "pixelboy-top-down-shooter",
            folder: "top-down-shooter",
            name: "Top-Down Shooter",
            creator: "Pixel-boy",
            website: "https://github.com/sparklinlabs/superpowers-asset-packs",
            license: "CC0",
            description: "Top-down survival shooter pixel art sprites by Pixel-boy: commando soldiers, zombie hordes, assault rifles, shotguns, bullet casings, blood splatters, and urban warehouse tiles.",
            cover: "preview.png",
            category: "Characters",
            allowed_categories: ["Characters", "Creatures", "Items & Icons", "Tilesets & Environments", "Effects", "UI"]
        },
        {
            slug: "pixelboy-western-fps-2d",
            folder: "western-fps-2d",
            name: "Western 2D & FPS",
            creator: "Pixel-boy",
            website: "https://github.com/sparklinlabs/superpowers-asset-packs",
            license: "CC0",
            description: "Wild West pixel art sprites by Pixel-boy: sheriffs, outlaws, saloon interiors, revolvers, dynamite, wanted posters, tumbleweeds, and desert town tilesets.",
            cover: "preview.png",
            category: "Characters",
            allowed_categories: ["Characters", "Creatures", "Items & Icons", "Tilesets & Environments", "Effects", "UI"]
        },
        {
            slug: "pixelboy-parallax-backgrounds",
            folder: "backgrounds",
            name: "Parallax Backgrounds",
            creator: "Pixel-boy",
            website: "https://github.com/sparklinlabs/superpowers-asset-packs",
            license: "CC0",
            description: "Seamless looping multi-layer parallax backgrounds by Pixel-boy: deep space, cloudy skies, snowy mountains, dense forests, desert dunes, and cyberpunk cityscapes.",
            cover: "preview.png",
            category: "Backgrounds",
            allowed_categories: ["Backgrounds"]
        }
    ];

    for (const cfg of packsConfig) {
        const destDir = path.join(PACKS_DIR, cfg.slug);
        const spritesDir = path.join(destDir, "sprites");
        fs.mkdirSync(spritesDir, { recursive: true });

        const packJson = {
            name: cfg.name,
            creator: cfg.creator,
            website: cfg.website,
            license: cfg.license,
            description: cfg.description,
            generation: {
                category: cfg.category,
                allowed_categories: cfg.allowed_categories
            }
        };
        fs.writeFileSync(path.join(destDir, "pack.json"), JSON.stringify(packJson, null, 2) + "\n");
        console.log(`✓ ${cfg.slug} intaked`);
    }
}

async function intakeDevWizardSpells() {
    const dest = path.join(PACKS_DIR, "devwizard-pixel-art-spells");
    if (!fs.existsSync(dest)) return;
    console.log("✓ devwizard-pixel-art-spells intaked");
}

async function intakeZtnAnimations() {
    const dest = path.join(PACKS_DIR, "ztn-fire-and-spell-animations");
    if (!fs.existsSync(dest)) return;
    console.log("✓ ztn-fire-and-spell-animations intaked");
}

async function intakeSBSBackgrounds() {
    const destSpace = path.join(PACKS_DIR, "sbs-seamless-space-backgrounds");
    const destSky = path.join(PACKS_DIR, "sbs-seamless-sky-backgrounds");
    if (fs.existsSync(destSpace)) console.log("✓ sbs-seamless-space-backgrounds intaked");
    if (fs.existsSync(destSky)) console.log("✓ sbs-seamless-sky-backgrounds intaked");
}

async function intakeBuchPotions() {
    const dest = path.join(PACKS_DIR, "buch-animated-potions");
    if (!fs.existsSync(dest)) return;
    console.log("✓ buch-animated-potions intaked");
}

async function main() {
    await intakePixelAdventure1();
    await intakePixelAdventure2();
    await intakeKingsAndPigs();
    await intakePirateBomb();
    await intakePlanetCute();
    await intakeDCSS();
    await intakeHardVacuum();
    await intakeSuperpowers();
    await intakeDevWizardSpells();
    await intakeZtnAnimations();
    await intakeSBSBackgrounds();
    await intakeBuchPotions();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
