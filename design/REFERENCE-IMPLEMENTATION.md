# User reference implementation

Implemented the supplied AGASSU reference as a responsive Vue homepage: oversized distressed red wordmark over live 3D, vertical scene entry, warm paper manifesto, asymmetric location gallery, outlined 03 experience panel, paper development cards, red threshold CTA and minimal footer. Copy remains English.

Images in editorial sections remain real AGASSU development captures, rather than implying the reference's photoreal illustrations are actual gameplay. The hero remains a functioning Three.js environment. The pool uses Tiles133D colour/normal/roughness maps from the game project; the portal retains Tiles140, Metal010, the original portal shader, models and animation. Pool and portal remain separate environments. Weather controls appear only inside the portal's immersive view. Main CTA opens the pool; final CTA opens the portal. Escape returns to the website.

Type uses locally available Impact/Arial Narrow for the condensed display treatment and Courier New for small labels; no remote font requests. Existing sign-in and account flows remain in the header/menu. Mobile layout stacks the editorial sections and retains scene controls.

Validation: Vue/TypeScript check and Vite production build; browser review at 1440px and 390px, section navigation, final CTA into portal, return action, heading bounds and console errors.
