# Monostar

![Monostar](monostar.png)

Spicetify theme with stars in the background, rounded everything, synced lyrics on the right and six color schemes you can switch right inside Spotify.

## Color schemes

Click the palette button in the top left corner and pick a color. It switches instantly and remembers your choice.

| Clean | Forest |
|:---:|:---:|
| ![Clean](monostar.png) | ![Forest](screenshots/forest.png) |
| **Pink** | **Lavender** |
| ![Pink](screenshots/pink.png) | ![Lavender](screenshots/lavender.png) |
| **Midnight** | **Sunset** |
| ![Midnight](screenshots/midnight.png) | ![Sunset](screenshots/sunset.png) |

## Installation

### Marketplace

1. Install [Spicetify](https://spicetify.app/) with the Marketplace
2. Open Marketplace → **Themes**, scroll down, click **Load more** and find Monostar
3. Click **Install**

If you get *"Please set current_theme to 'marketplace'"*, run this first:

```
spicetify config current_theme marketplace
spicetify apply
```

### Manual

1. Install [Spicetify](https://spicetify.app/)
2. Click **Code → Download ZIP** on this page and unzip it
3. Copy the `Monostar` folder into the `Themes` folder (run `spicetify path userdata` to see where it is)
4. Run:
   ```
   spicetify config current_theme Monostar color_scheme Clean inject_theme_js 1
   spicetify apply
   ```

After a Spotify update, run `spicetify backup apply` to bring the theme back.
