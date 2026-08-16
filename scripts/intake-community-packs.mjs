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
    fs.mkdirSync(path.join(targetDir, "sprites"), { recursive: true });

    const zipPath = "/tmp/pixelfrog/pb.zip";
    const tmpExtract = "/tmp/pb_extracted";
    fs.rmSync(tmpExtract, { recursive: true, force: true });
    execSync(`unzip -q "${zipPath}" -d "${tmpExtract}"`);

    // Copy sprites
    if (fs.existsSync(path.join(tmpExtract, "Sprites"))) {
        fs.cpSync(path.join(tmpExtract, "Sprites"), path.join(targetDir, "sprites"), { recursive: true });
    }

    // Find cover
    const playerIdle = path.join(targetDir, "sprites", "1-Player-Bomb Guy", "1-Idle", "1.png");
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

async function main() {
    await intakePixelAdventure1();
    await intakePixelAdventure2();
    await intakeKingsAndPigs();
    await intakePirateBomb();
    await intakePlanetCute();
    await intakeDCSS();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
