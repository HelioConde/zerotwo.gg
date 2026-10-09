/**
 * Canonical image paths for ZeroTwo.
 * Keep public-facing images in public/assets/zerotwo and UI states at
 * public/*.webp. Historical source sheets live outside /public.
 *
 * Paths are resolved against Vite's BASE_URL for GitHub Pages and local dev.
 */
export const zerotwoArt=(fileName:string)=>
  // Vite dev and GitHub Pages expect a literal comma in these legacy filenames.
  // Encode accents/spaces, but keep commas in the pathname.
  import.meta.env.BASE_URL+'assets/zerotwo/'+encodeURIComponent(fileName).replace(/%2C/gi,',');

export const VISUAL_ASSETS={
  home:{
    discover:zerotwoArt('Imagem do ChatGPT 1 de out. de 2026, 17_10_14-3.png'),
    remember:zerotwoArt('Imagem do ChatGPT 1 de out. de 2026, 17_10_13-2.png'),
    people:zerotwoArt('Imagem do ChatGPT 1 de out. de 2026, 17_10_15-4.png'),
    closing:zerotwoArt('Imagem do ChatGPT 1 de out. de 2026, 17_10_12-1.png')
  },
  state:{
    empty:import.meta.env.BASE_URL+'empty-state.webp',
    connectionError:import.meta.env.BASE_URL+'connection-error.webp'
  },
  sharing:{
    matchStory:import.meta.env.BASE_URL+'match-story-background.webp'
  }
} as const;
