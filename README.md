# New Tab with bookmarks

A minimalistic, customizable new tab page extension for Chromium-based browsers. It displays your bookmarks in rows, supports setting your own CSS and allows Vimium C to inject itself for that tasty vim motion flow. 

## Features

- **Custom bookmark display:** Shows bookmarks from a selected folder in rows. 
- **Customizable Layout:** Choose how many icons per row and the maximum number of bookmarks to display.
- **Custom CSS:** Add your own styles in the options page for advanced tweaks.
- **Background Styling:** Use the `#background` selector in your custom CSS for an option to add a background image (check the [sample](#sample-background-image-css)).
- **Vimium C handling** Can use Vimium C plugin directly on the page. 
- **Favicon Handling:** Uses Google’s favicon service with a fallback to a default icon.

## Installation

1. **From releases**
- [latest](https://github.com/Zetaniis/releases/latest) 

2. **From the repo**
- Load the repo as an unpacked extension in Chrome via `chrome://extensions`.

## Sample background image css

```css
#background{
    background: center / contain url("https://dummyimage.com/300.png/09f/fff&text=Hello"), #000000;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
}

#background::before {
    content: "";
    position: fixed;
    width: 100%;
    height: 100%;
    background: inherit;
    filter: brightness(30%);
    z-index: -1;
}
```

## Other
- Icons taken from - https://fonts.google.com/icons. 
