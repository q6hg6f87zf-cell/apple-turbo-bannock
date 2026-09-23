# Selective migration

Source: `q6hg6f87zf-cell/apple-turbo-dream-harbor` at `ef95da0e1815539b6c4a25abd6919aa67a16d094`.

## Carried forward

| Source                                                      | Destination                     | Purpose                                                       |
| ----------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------- |
| `public/art/title-wide.jpg`                                 | `public/art/ironclad-title.jpg` | Start-screen world identity                                   |
| `public/art/opening/tyrone-portrait.jpg`                    | `public/art/tyrone.jpg`         | Tyrone dialogue identity                                      |
| `public/art/npcs/portraits/travis.jpg`                      | `public/art/travis.jpg`         | Workshop speaker identity                                     |
| Ironclad, Vault 13, Tyrone, Travis, Project Vesper          | Explicit opening chapter        | Existing setting and character continuity                     |
| Weapon modifications, armour trade-offs, telegraphed combat | New pure engine                 | Retained useful design ideas with much smaller implementation |

No old source modules were copied into the runtime. The legacy UI, economy, authentication, migrations, casino, store, AI calls, large video library, and unrelated regions are not dependencies of this chapter. Old saves are NOT imported: the schemas and progression differ materially.

The model is a newly constructed stylized diorama, not the old illustrated regional map. Tyrone retains a single wheel and CRT face. These models are a new visual interpretation, not fidelity-matched production character assets. The existing story names are retained; this specific chapter and its dialogue are new and need Brent's canon review.

All three images are copied byte-for-byte. Their inclusion was authorized by the repository owner's migration request. That does not establish their underlying commercial licensing; an App Store release still requires an asset-rights review. Third-party npm package licenses remain applicable. No blanket open-source license is assigned to the user's game or art.
