export const  el        = css => document.querySelector(css);
export const  create    = css => document.createElement(css);
export const  group     = css => document.querySelectorAll(css);

export const loadHTML   = async url => (await fetch(url)).text();
export const loadJSON   = async url => (await fetch(url)).json();