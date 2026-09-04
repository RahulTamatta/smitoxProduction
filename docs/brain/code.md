<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Smitox Marketplace - MomsGenie Style Redesign</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&amp;family=Plus+Jakarta+Sans:wght@400;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        .material-symbols-outlined {
          font-variation-settings:
          'FILL' 0,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "on-secondary-fixed-variant": "#85145a",
                      "surface": "#f8f9ff",
                      "surface-container-high": "#dfe9fa",
                      "error-container": "#ffdad6",
                      "tertiary-container": "#956e00",
                      "on-tertiary-fixed": "#261a00",
                      "inverse-primary": "#8ecdff",
                      "outline-variant": "#bfc7d1",
                      "on-secondary": "#ffffff",
                      "surface-tint": "#006494",
                      "surface-dim": "#d1dbec",
                      "primary-container": "#007bb5",
                      "on-primary-container": "#fcfcff",
                      "on-primary-fixed": "#001e30",
                      "tertiary-fixed": "#ffdf9f",
                      "error": "#ba1a1a",
                      "secondary-fixed": "#ffd8e7",
                      "secondary-container": "#fc79bd",
                      "surface-bright": "#f8f9ff",
                      "on-secondary-container": "#76014e",
                      "surface-container-low": "#eef4ff",
                      "surface-container": "#e5eeff",
                      "inverse-surface": "#27313e",
                      "on-secondary-fixed": "#3d0026",
                      "on-background": "#121c28",
                      "primary": "#006191",
                      "secondary": "#a43073",
                      "on-primary-fixed-variant": "#004b71",
                      "on-tertiary": "#ffffff",
                      "surface-container-lowest": "#ffffff",
                      "on-surface-variant": "#3f4850",
                      "primary-fixed": "#cbe6ff",
                      "secondary-fixed-dim": "#ffafd3",
                      "on-surface": "#121c28",
                      "primary-fixed-dim": "#8ecdff",
                      "on-primary": "#ffffff",
                      "inverse-on-surface": "#eaf1ff",
                      "tertiary": "#765700",
                      "tertiary-fixed-dim": "#f9bd22",
                      "on-tertiary-fixed-variant": "#5c4300",
                      "background": "#f8f9ff",
                      "outline": "#6f7881",
                      "on-error-container": "#93000a",
                      "surface-variant": "#d9e3f4",
                      "surface-container-highest": "#d9e3f4",
                      "on-tertiary-container": "#fffbff",
                      "on-error": "#ffffff"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "stack-md": "24px",
                      "margin-desktop": "40px",
                      "margin-mobile": "16px",
                      "base": "8px",
                      "stack-sm": "12px",
                      "container-max": "1280px",
                      "stack-lg": "48px",
                      "gutter": "24px"
              },
              "fontFamily": {
                      "headline-xl": [
                              "Plus Jakarta Sans"
                      ],
                      "label-md": [
                              "Be Vietnam Pro"
                      ],
                      "body-md": [
                              "Be Vietnam Pro"
                      ],
                      "label-sm": [
                              "Be Vietnam Pro"
                      ],
                      "headline-lg": [
                              "Plus Jakarta Sans"
                      ],
                      "headline-md": [
                              "Plus Jakarta Sans"
                      ],
                      "headline-lg-mobile": [
                              "Plus Jakarta Sans"
                      ],
                      "body-lg": [
                              "Be Vietnam Pro"
                      ]
              },
              "fontSize": {
                      "headline-xl": [
                              "48px",
                              {
                                      "lineHeight": "56px",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "800"
                              }
                      ],
                      "label-md": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "letterSpacing": "0.02em",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-md": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "400"
                              }
                      ],
                      "label-sm": [
                              "12px",
                              {
                                      "lineHeight": "16px",
                                      "fontWeight": "700"
                              }
                      ],
                      "headline-lg": [
                              "32px",
                              {
                                      "lineHeight": "40px",
                                      "letterSpacing": "-0.01em",
                                      "fontWeight": "700"
                              }
                      ],
                      "headline-md": [
                              "24px",
                              {
                                      "lineHeight": "32px",
                                      "fontWeight": "700"
                              }
                      ],
                      "headline-lg-mobile": [
                              "28px",
                              {
                                      "lineHeight": "34px",
                                      "fontWeight": "700"
                              }
                      ],
                      "body-lg": [
                              "18px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "400"
                              }
                      ]
              }
      },
          },
        }
      </script>
</head>
<body class="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col">
<!-- Promo Banner -->
<div class="bg-secondary-fixed text-on-secondary-fixed text-center py-2 text-label-sm font-label-sm flex justify-center items-center gap-2">
<span>For Smoother &amp; Faster Checkout &amp; <span class="text-secondary font-bold">Exclusive Offers</span></span>
<button class="bg-surface text-secondary px-3 py-1 rounded-full text-xs font-bold border border-secondary ml-4 hover:bg-secondary hover:text-on-secondary transition-colors">Install App</button>
</div>
<!-- Secondary Top Bar -->
<div class="bg-primary text-on-primary py-2 px-margin-mobile md:px-margin-desktop text-label-sm font-label-sm flex justify-between items-center hidden md:flex">
<span>hyperlocal, ₹749 for wider Gurgaon &amp; ₹949 for others!</span>
</div>
<!-- Main Navigation -->
<header class="bg-surface shadow-sm sticky top-0 z-50 flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4">
<!-- Logo -->
<a class="flex items-center gap-2 shrink-0" href="#">
<span class="text-headline-md font-headline-md font-extrabold text-primary">Smitox Marketplace</span>
</a>
<!-- Search Bar (Desktop) -->
<div class="hidden md:flex flex-1 max-w-2xl mx-8">
<div class="relative w-full">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">search</span>
<input class="w-full pl-12 pr-4 py-3 rounded-full bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md" placeholder="Search for products" type="text"/>
</div>
</div>
<!-- Actions -->
<div class="flex items-center gap-4 shrink-0 text-primary">
<button class="p-2 rounded-full hover:bg-surface-container-low transition-colors md:hidden">
<span class="material-symbols-outlined">search</span>
</button>
<button class="p-2 rounded-full border border-outline-variant/30 hover:bg-surface-container-low transition-colors hidden md:flex items-center justify-center">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">favorite</span>
</button>
<button class="p-2 rounded-full border border-outline-variant/30 hover:bg-surface-container-low transition-colors flex items-center justify-center">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">shopping_cart</span>
</button>
<button class="bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-md text-label-md font-bold hover:bg-primary/90 transition-colors hidden md:block shadow-sm">
                Login
            </button>
</div>
</header>
<!-- Sub Navigation -->
<nav class="bg-surface-container-low hidden md:block border-b border-outline-variant/20">
<div class="max-w-container-max mx-auto px-margin-desktop flex items-center justify-between py-3">
<button class="flex items-center gap-1 text-on-surface font-label-md text-label-md hover:text-primary transition-colors font-bold">
                All Categories
                <span class="material-symbols-outlined">expand_more</span>
</button>
<div class="flex items-center gap-8 text-on-surface-variant font-label-md text-label-md">
<a class="hover:text-primary transition-colors" href="#">Gifts &amp; Toys</a>
<a class="hover:text-primary transition-colors" href="#">Stationery</a>
<a class="hover:text-primary transition-colors" href="#">Summer Special</a>
<a class="hover:text-primary transition-colors" href="#">Art &amp; Craft</a>
<a class="hover:text-primary transition-colors" href="#">Books</a>
<a class="hover:text-primary transition-colors" href="#">Bottles &amp; Mugs</a>
</div>
</div>
</nav>
<!-- Search Bar (Mobile) -->
<div class="md:hidden px-margin-mobile py-4 bg-surface border-b border-outline-variant/20">
<div class="relative w-full">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">search</span>
<input class="w-full pl-12 pr-4 py-3 rounded-full bg-surface-container-low border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md" placeholder="Search for products" type="text"/>
</div>
</div>
<!-- Main Content Area -->
<main class="flex-1 flex flex-col">
<!-- Hero Section (Bento Grid Style) -->
<section class="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-md md:py-stack-lg">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter min-h-[500px]">
<!-- Main Feature -->
<div class="lg:col-span-8 rounded-[32px] overflow-hidden relative bg-secondary p-8 md:p-12 flex flex-col justify-center shadow-lg group">
<img alt="Craft Supplies Background" class="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-700" data-alt="A vibrant, top-down flatlay of high-quality kids arts and crafts supplies spread out on a clean white surface. The arrangement includes colorful paints, brushes, bright construction paper, and drawing tools. The lighting is bright and cheerful, enhancing the vivid colors of the supplies, creating a playful, engaging, and premium aesthetic perfect for an arts and crafts hero banner." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAALgPijt2hCftZ31SApTQTKB5YhQKKRyCHisalzkaVQSl3tsnlKJb0FUjiaP6t-QiouKcWpQozfF8q295P6uYhrhBOQKpW7f5mi5q0mFmvEbfDGjp0fSjOnRefsIpzHYJh2wbJS7psxsh4kqY8hIai1A3c5d9G1OhWKgHFilJAaKQNNsIX6KuFqnr6kEwwIvsA5Up3SJLLPbs_u0tkYVFxWMpEc-S-yM2iHp2qnfWNjE_Gcz_VeyJzAQsrs5TGDJ8kJeCzBWEcpDnS"/>
<div class="absolute inset-0 bg-gradient-to-r from-secondary to-secondary/60"></div>
<div class="relative z-10 max-w-md text-on-secondary">
<span class="inline-block bg-surface text-secondary px-4 py-1.5 rounded-full text-label-sm font-label-sm font-bold mb-6 shadow-sm">Mega Sale</span>
<h1 class="text-headline-lg-mobile md:text-headline-xl font-headline-lg-mobile md:font-headline-xl mb-4 leading-tight">Creative Crafts for Imaginative Young Artists!</h1>
<p class="text-body-lg font-body-lg mb-8 opacity-90">Discover our charming assortment of arts and crafts supplies for kids and get them sent directly to your home. Bulk ordering available.</p>
<button class="bg-surface text-primary px-8 py-3.5 rounded-full font-label-md text-label-md font-bold hover:bg-surface-container-low transition-colors shadow-md flex items-center gap-2 w-max">
                            Explore Collection
                            <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
</button>
</div>
<!-- Decorative elements -->
<div class="absolute top-8 right-8 bg-[#ff3366] text-white w-24 h-24 rounded-full flex flex-col items-center justify-center rotate-12 shadow-lg shadow-[#ff3366]/30">
<span class="text-headline-md font-headline-md font-extrabold leading-none">50%</span>
<span class="text-label-sm font-label-sm font-bold uppercase tracking-wide">OFF</span>
</div>
</div>
<!-- Side Promotions -->
<div class="lg:col-span-4 flex flex-col gap-gutter">
<!-- Top Promo -->
<div class="flex-1 rounded-[24px] overflow-hidden relative bg-primary-container p-6 flex flex-col justify-end group shadow-md">
<img alt="Stationery" class="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500" data-alt="A collection of colorful, premium back-to-school supplies, including modern backpacks, colorful notebooks, and sleek pens, arranged neatly on a pastel blue background. The lighting is soft and even, giving a fresh, organized, and inviting look suitable for an educational or stationery product promotion." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa3af4VP7VGGS_z1IhVFr-bts-XGYCn6e5CLJkCrxDxV1A5b5A3ruYMBLh3C_htaV_46CSS6rPFyQggc01s90OUbssluEJXGI-2LUzSy7Tj-TuMPDS-9yqZzcu7Gx2NK60XmJaHrRy3o_ifkBGx6Xn6u8S17jVOfklYfzURwsAP3hiAZXMRAXMNGtwe5amMD1dcR-cjskChHRwQOrWRHMyotiNwD9RbsiE-T0jwVvUBgUPgaAff0iy0hc81h1d-yFXkVaiijYrlYl6"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary-fixed-variant/90 to-transparent"></div>
<div class="relative z-10 text-on-primary">
<h3 class="text-headline-md font-headline-md mb-2">Back to School</h3>
<p class="text-body-md font-body-md mb-4 opacity-90 line-clamp-2">Premium stationery kits for the new term. MOQ: 50 sets.</p>
<a class="inline-flex items-center text-label-md font-label-md font-bold hover:underline" href="#">
                                View Deals <span class="material-symbols-outlined ml-1 text-[18px]">chevron_right</span>
</a>
</div>
</div>
<!-- Bottom Promo -->
<div class="flex-1 rounded-[24px] overflow-hidden relative bg-[#ffdf9f] p-6 flex flex-col justify-end group shadow-md">
<img alt="Toys" class="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500" data-alt="A curated selection of high-quality, plush wooden and soft toys arranged on a warm, sunny yellow background. The toys look engaging, safe, and beautifully crafted. The lighting is bright and cheerful, highlighting the textures and colors of the toys, perfect for a kids' toy category feature." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCB8tfkA9dR-1CkdS8O5H71hJJIJLhTonyCv1aMaxcmqnFIcw0vW-qa7BhpZhYyxHQeFzYNAas78LOxKb-uM8L4buHTrd4BhC_vE0qI9n8YV3_ITWZdUgE3chPROhdHq7-o-e-PuoY6kks8EmYPJ828QH75cgA_apyUpfLMMcGjBamXbucnsiQFpOkFJ4UPRHJ-mfhnUGKFAjvkoSB4HXFYYnC-XNc3lxY_mHvKGXfQrgqQzxSQsG_JXJ8MfW_ZFoJQT-qg6VwqqKKq"/>
<div class="absolute inset-0 bg-gradient-to-t from-[#956e00]/80 to-transparent"></div>
<div class="relative z-10 text-on-tertiary-fixed">
<h3 class="text-headline-md font-headline-md mb-2 text-white">Summer Toys</h3>
<p class="text-body-md font-body-md mb-4 opacity-90 text-white line-clamp-2">Keep them active with our outdoor collection. Bulk discounts available.</p>
<a class="inline-flex items-center text-label-md font-label-md font-bold text-white hover:underline" href="#">
                                Shop Now <span class="material-symbols-outlined ml-1 text-[18px]">chevron_right</span>
</a>
</div>
</div>
</div>
</div>
</section>
<!-- Categories Section -->
<section class="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-md">
<h2 class="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg mb-8 text-center text-primary-fixed-variant">Explore Categories</h2>
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
<!-- Category 1 -->
<a class="flex flex-col items-center gap-3 group" href="#">
<div class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-secondary-fixed/50 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-secondary-fixed">
<img alt="Soft Toys" class="w-16 h-16 md:w-20 md:h-20 object-contain mix-blend-multiply opacity-80" data-alt="A single, cute, high-quality teddy bear sitting against a clean white background. The lighting is soft and studio-quality, emphasizing the plush texture and friendly appearance of the toy. Ideal as a clean icon for a 'Soft Toys' category." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAx4d_pzWfXgjL2HRr5u8hY46E7shui0HUDAYhQ46RWcKJSBhcy6s8lwY7uHuPRRb2DRYWRo6wMj4H7mh5Mkeip-jLPSLEKwairi8hw3bAFsXxCttkCp8qAV2zsxgtZlb1_0SEXI55dUzSHIySAcECmXpVMTx_ZZJm5PZo1e5y5u7Fyw16zI-ZIzMVJFgc1Yqq8p0RCUdvwbBjQUZ2E9evaQJSBqoyKzwvkWt-n4NBggZeWvXkj2Sssif9KmbWnUMANbQ9QAyMedpBW"/>
</div>
<span class="text-label-md font-label-md text-on-surface text-center font-bold">Soft Toys</span>
</a>
<!-- Category 2 -->
<a class="flex flex-col items-center gap-3 group" href="#">
<div class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary-fixed/50 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-primary-fixed">
<img alt="Art &amp; Craft" class="w-16 h-16 md:w-20 md:h-20 object-contain mix-blend-multiply opacity-80" data-alt="A colorful jar of high-quality colored pencils and markers on a clean background. Bright, saturated colors with soft lighting, perfect for an 'Art &amp; Craft' category icon." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkoklfgcMwDmGuCn17Phc3hsPkDa_0s4ChLdoowmhYQcWV5OHszoscPcn2dWKmwhdl1uTZoAOibCwf4_eIQ9v8uC6lhynttaWqq4LvMZw3VMx2PhAazRTCB2Q1MFkkkITgOH-6GPi41mtBuXRzOVwPkVTeK6-OVMB6h0hYFTWJRB4lOZ1w_pyq-Bq9rvg6gIwycRI1Uh0-c58fi75YEdw5qzi481Np1ZOxzF5VO0ycaNn9My8RBK0O1J6WJOvRx2DTDL8r9Xx1laNf"/>
</div>
<span class="text-label-md font-label-md text-on-surface text-center font-bold">Art &amp; Craft</span>
</a>
<!-- Category 3 -->
<a class="flex flex-col items-center gap-3 group" href="#">
<div class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-tertiary-fixed/50 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-tertiary-fixed">
<img alt="Summer Special" class="w-16 h-16 md:w-20 md:h-20 object-contain mix-blend-multiply opacity-80" data-alt="A vibrant, plastic summer beach bucket and spade set on a white background. Bright colors, clear lighting, perfect for a 'Summer Toys' category icon." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJAFS3eZrsIvtjgYLTjQdIPWHY5Rg8PScfzDvsPz3igI6No7VpZInoIgexwBtVPtU9RUM3mrWrWMMFC2N8reZ9xYIi5v-goPqwVtfBI9QPSxJSDlx58sX1Yd_yfnHKvFBy7bd0caAQhzk9BfbgNDHjq1aVm9369rUM01Mt04-2ETXJfmEzo1qBUIGlhm62Pg9ELdS1In5eM8Navjzjxd_MhoajaCTFubaQcjXrx4cziKq18EW9InioDMFIi_ImODFxGJS-Hp9EzKTv"/>
</div>
<span class="text-label-md font-label-md text-on-surface text-center font-bold">Summer Special</span>
</a>
<!-- Category 4 -->
<a class="flex flex-col items-center gap-3 group" href="#">
<div class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-surface-container-high flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-outline-variant/30">
<img alt="Stationery" class="w-16 h-16 md:w-20 md:h-20 object-contain mix-blend-multiply opacity-80" data-alt="A neat stack of colorful notebooks and a sleek pen on a white background. Clean, professional lighting, suitable for a 'Stationery' category icon." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvQGG3FLHW0ilqHSzVd3R3zoWNN6H_ic5urzCvprKolaKhhMzd8VgMBFTqOMH43AnsSEPX66m1ObtEQuhegogxBsb2zGL29vt4VnZDeToXIAttmAD846c8nuRzvNkCDQYO1RHBFr2xRXM56jwP7HJTK8z1gLzWZkpa5ElQOe4z62Oem9sTOl8Wcz0bJSm_3vMUQ6aLcwdXQbqG7i2GiRkr_vjFhR4oyrG9CrtiJkcb1Yq7wC_Km4WODEGTmI6GuXAIjN_k-K7kJj1l"/>
</div>
<span class="text-label-md font-label-md text-on-surface text-center font-bold">Stationery</span>
</a>
<!-- Category 5 -->
<a class="flex flex-col items-center gap-3 group" href="#">
<div class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-secondary-container/20 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-secondary-container/50">
<img alt="Books" class="w-16 h-16 md:w-20 md:h-20 object-contain mix-blend-multiply opacity-80" data-alt="A neat stack of colorful children's books on a clean white background. Bright, inviting lighting, perfect for an 'Educational Books' category icon." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9rvKERXEqEDw3q1hYu64yJUjq7nAJ5osdzMbZlOTP6TyFZB8CbjH2AYrWsM_fh-Rtmf__mAoknMTG7cjZQWdTa9Hbpyx6fbgoEnuYUTnsP3hr1iw1QUJ79a1rIi6HQKlV1D3GkO_28fADk66ob7SNHGImI90OXVSD7cj1-hFb_Jhgp7eYD_bHt5K2l8ye2H2WEJd-wXhsGI-SfbqMa45QeBskmMdEhs0M33z9y9ZJxaWCS0ymwPSfXtHUVOgBY4_hdxnsmaSQAUpu"/>
</div>
<span class="text-label-md font-label-md text-on-surface text-center font-bold">Books</span>
</a>
<!-- Category 6 -->
<a class="flex flex-col items-center gap-3 group" href="#">
<div class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-inverse-primary/30 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-inverse-primary/50">
<img alt="Bottles &amp; Mugs" class="w-16 h-16 md:w-20 md:h-20 object-contain mix-blend-multiply opacity-80" data-alt="A brightly colored, high-quality kids water bottle with a fun design on a white background. Studio lighting, perfect for a 'Bottles &amp; Mugs' category icon." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcHrdpcTZkVpg-fNkqG4_b7yDQ7NXMRHTNYwjkg8laj6WL_brHIE6eVw1gWMoTzpCyuhlG_RriBJ-IWvtTM0C3_gvezxczzS4upBeEXQvMHRAEEKIxSttvJPl4aovNHcsqaSjpRHEmnL4_3Ta9gBjMKwdy3TDJG2tqiJD4O2j_kIcTGpwnLL6Hse4FSubYfp4CdbB5EzzDQxLuDwBV0qUx49aqmwnYZU0hy4rFZyRtVYcAss-H48sAzY0uBJYmG1XucAG2jZhW7cnx"/>
</div>
<span class="text-label-md font-label-md text-on-surface text-center font-bold">Bottles &amp; Mugs</span>
</a>
</div>
</section>
<!-- Featured Products -->
<section class="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg bg-surface-container-low rounded-t-[40px]">
<div class="flex justify-between items-end mb-8">
<div>
<h2 class="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-primary-fixed-variant mb-2">Bestsellers in Bulk</h2>
<p class="text-body-md font-body-md text-on-surface-variant">Top-rated supplies for retailers and schools.</p>
</div>
<a class="hidden md:inline-flex items-center text-primary font-label-md text-label-md font-bold hover:text-primary-container transition-colors" href="#">
                    View All <span class="material-symbols-outlined ml-1">arrow_forward</span>
</a>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
<!-- Product Card 1 -->
<div class="bg-surface rounded-[24px] p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group border border-transparent hover:border-primary/20 relative">
<!-- Badges -->
<div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
<span class="bg-[#ffeb3b] text-[#5c4300] px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm w-max">Bestseller</span>
</div>
<button class="absolute top-4 right-4 z-10 p-2 bg-surface/80 backdrop-blur-sm rounded-full text-outline-variant hover:text-secondary transition-colors shadow-sm">
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 0;">favorite</span>
</button>
<!-- Image -->
<div class="aspect-square rounded-[16px] bg-surface-container-low mb-4 overflow-hidden relative">
<img alt="Watercolor Set" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A premium set of 24 watercolor paints in a sleek metal tin, displayed open to show the vibrant color pans. Shot from directly above on a clean white background with soft, natural lighting. Perfect for a product listing image in an arts and crafts store." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkqJDshzoXJku0XG4XzBtFk3RTVB8peX8cTVhQM9my0HIDwImkioOWzifPZ6r3EVF541bALbJixK3DI62W5x8mudCyptqwTx4d8A2SAHzqN6Ikv6SZ1DZwEq7BInZtopHSELJWgsvsDIaiTTiF5MXGnwjVTs0ixB3_SUX8dbIQIGxy4_aQtRSXxsPiOn-m0lzQXMbrl5LCVfDN5_dBBGE0CBsYIchSncoo21QpMQIvavJVFrKMNPkS74vDP87kXStUfA-BhqrHiiiE"/>
</div>
<!-- Details -->
<div class="flex-1 flex flex-col">
<div class="text-label-sm font-label-sm text-outline mb-1 uppercase tracking-wider">Art &amp; Craft</div>
<h3 class="text-body-lg font-body-lg font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">Premium Watercolor Palette (24 Colors)</h3>
<!-- B2B Data -->
<div class="bg-surface-container-low rounded-lg p-3 mb-4 mt-auto">
<div class="flex justify-between items-center mb-1">
<span class="text-label-sm font-label-sm text-on-surface-variant">Bulk Price</span>
<span class="text-headline-md font-headline-md text-primary font-bold">₹150<span class="text-label-sm font-normal text-on-surface-variant">/pc</span></span>
</div>
<div class="flex items-center gap-1 text-label-sm font-label-sm">
<span class="material-symbols-outlined text-[16px] text-secondary">inventory_2</span>
<span class="text-secondary font-bold">MOQ: 50 Pieces</span>
</div>
</div>
<!-- Action -->
<button class="w-full bg-primary text-on-primary py-3 rounded-full font-label-md text-label-md font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-[20px]">shopping_cart</span>
                            Add to Cart
                        </button>
</div>
</div>
<!-- Product Card 2 -->
<div class="bg-surface rounded-[24px] p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group border border-transparent hover:border-primary/20 relative">
<!-- Badges -->
<div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
<span class="bg-secondary text-on-secondary px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm w-max">New Arrival</span>
</div>
<button class="absolute top-4 right-4 z-10 p-2 bg-surface/80 backdrop-blur-sm rounded-full text-outline-variant hover:text-secondary transition-colors shadow-sm">
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 0;">favorite</span>
</button>
<!-- Image -->
<div class="aspect-square rounded-[16px] bg-surface-container-low mb-4 overflow-hidden relative">
<img alt="Plush Bear" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A soft, high-quality plush brown teddy bear sitting upright on a clean pastel pink background. Studio lighting highlights the soft texture of the fur. Ideal for a toy product listing." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOJ8wXVHifw-oG75iVON3dPQzTJVmJNgYmto8XJqyPSO4uyhY7LSyb1z31CiY_uIsRTPsKSwFlEwdWU1wQzgWhwjqL2nxPgZOycwtRXPCH9EBL4jVYYNsUy9roLhbpjTV0984jbqDqtjWS-ixveUjhWWVwQDQDWdDIJlwIZx5_5n3qXXUjMajSjcH7vV8QwR5qtyZooEvVrS6BGPKqQkPNkBcCHZlCMTGtkgzgH9lsyZMicZ-iswoRBbiXVmJ52ESQP1Hn_OHRKlAA"/>
</div>
<!-- Details -->
<div class="flex-1 flex flex-col">
<div class="text-label-sm font-label-sm text-outline mb-1 uppercase tracking-wider">Soft Toys</div>
<h3 class="text-body-lg font-body-lg font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">Classic Huggable Plush Bear - 12 inch</h3>
<!-- B2B Data -->
<div class="bg-surface-container-low rounded-lg p-3 mb-4 mt-auto">
<div class="flex justify-between items-center mb-1">
<span class="text-label-sm font-label-sm text-on-surface-variant">Bulk Price</span>
<span class="text-headline-md font-headline-md text-primary font-bold">₹220<span class="text-label-sm font-normal text-on-surface-variant">/pc</span></span>
</div>
<div class="flex items-center gap-1 text-label-sm font-label-sm">
<span class="material-symbols-outlined text-[16px] text-secondary">inventory_2</span>
<span class="text-secondary font-bold">MOQ: 20 Pieces</span>
</div>
</div>
<!-- Action -->
<button class="w-full bg-primary text-on-primary py-3 rounded-full font-label-md text-label-md font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-[20px]">shopping_cart</span>
                            Add to Cart
                        </button>
</div>
</div>
<!-- Product Card 3 -->
<div class="bg-surface rounded-[24px] p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group border border-transparent hover:border-primary/20 relative">
<button class="absolute top-4 right-4 z-10 p-2 bg-surface/80 backdrop-blur-sm rounded-full text-outline-variant hover:text-secondary transition-colors shadow-sm">
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 0;">favorite</span>
</button>
<!-- Image -->
<div class="aspect-square rounded-[16px] bg-surface-container-low mb-4 overflow-hidden relative">
<img alt="Notebook Set" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A set of three premium hardcover notebooks in pastel colors (mint, peach, and baby blue) stacked neatly. Shot against a white background with bright, even lighting to showcase the matte texture of the covers. Product listing shot." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGBqLkkcpe8aQpQ1uyBfe9Mv4poW6awUL-5WkssrPoi6SaErB0zqiQQ_s2m6v63Vm0lT2cUP8ZmiJVlWtZ9-yd9G0qOChqgvj_akhRe4jNshD88i_nWZcthQxVSQMe9XirI2X2oCh32y_DhyRRqYkGL06c5PnE3nLr__5Wuxk8riXZ0cr2un4DXyocgg1-tivJizjsL5RBtdpjviv2JladMKmmKqkRToweSYhqEwPc77Tnlh8IQSbS-lXpeTygQLDD5G39-K2OT_jd"/>
</div>
<!-- Details -->
<div class="flex-1 flex flex-col">
<div class="text-label-sm font-label-sm text-outline mb-1 uppercase tracking-wider">Stationery</div>
<h3 class="text-body-lg font-body-lg font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">Pastel Hardcover Notebook Set (Pack of 3)</h3>
<!-- B2B Data -->
<div class="bg-surface-container-low rounded-lg p-3 mb-4 mt-auto">
<div class="flex justify-between items-center mb-1">
<span class="text-label-sm font-label-sm text-on-surface-variant">Bulk Price</span>
<span class="text-headline-md font-headline-md text-primary font-bold">₹180<span class="text-label-sm font-normal text-on-surface-variant">/set</span></span>
</div>
<div class="flex items-center gap-1 text-label-sm font-label-sm">
<span class="material-symbols-outlined text-[16px] text-secondary">inventory_2</span>
<span class="text-secondary font-bold">MOQ: 100 Sets</span>
</div>
</div>
<!-- Action -->
<button class="w-full bg-primary text-on-primary py-3 rounded-full font-label-md text-label-md font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-[20px]">shopping_cart</span>
                            Add to Cart
                        </button>
</div>
</div>
<!-- Product Card 4 -->
<div class="bg-surface rounded-[24px] p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group border border-transparent hover:border-primary/20 relative">
<!-- Badges -->
<div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
<span class="bg-[#e8f5e9] text-[#2e7d32] px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm w-max">Eco Friendly</span>
</div>
<button class="absolute top-4 right-4 z-10 p-2 bg-surface/80 backdrop-blur-sm rounded-full text-outline-variant hover:text-secondary transition-colors shadow-sm">
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 0;">favorite</span>
</button>
<!-- Image -->
<div class="aspect-square rounded-[16px] bg-surface-container-low mb-4 overflow-hidden relative">
<img alt="Water Bottle" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A stainless steel, insulated kids water bottle with a playful dinosaur print, standing upright on a soft blue background. Studio lighting to emphasize the metallic finish and colorful print. E-commerce product shot." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEYa8vQ-NibVE9kRWYE2PcOoVJxcvUNoB4wR4RCJ_OD_f0LmwuxsnFLgfKkdrQSUKnw-g_mQnVLZvEmJOCN8Ywia8LPgz9Ok2urxvsbDe4AGaae2QBmiuJaM-8BsV9zzU4PCycMcssXZl0p241jUyljuUm5Xk_wPAk20N0uMs1VxjQZbAOQ9iJBOsyG4P0_OHFzwqEG4dSlVt1tZBVLWjDcYobFKe4_csMCJVuyaNJT7qrE7V4HQxi2iChZ3X0iUyuy9jaYVjwOM5G"/>
</div>
<!-- Details -->
<div class="flex-1 flex flex-col">
<div class="text-label-sm font-label-sm text-outline mb-1 uppercase tracking-wider">Bottles &amp; Mugs</div>
<h3 class="text-body-lg font-body-lg font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">Insulated Steel Bottle - Dino Print 500ml</h3>
<!-- B2B Data -->
<div class="bg-surface-container-low rounded-lg p-3 mb-4 mt-auto">
<div class="flex justify-between items-center mb-1">
<span class="text-label-sm font-label-sm text-on-surface-variant">Bulk Price</span>
<span class="text-headline-md font-headline-md text-primary font-bold">₹280<span class="text-label-sm font-normal text-on-surface-variant">/pc</span></span>
</div>
<div class="flex items-center gap-1 text-label-sm font-label-sm">
<span class="material-symbols-outlined text-[16px] text-secondary">inventory_2</span>
<span class="text-secondary font-bold">MOQ: 30 Pieces</span>
</div>
</div>
<!-- Action -->
<button class="w-full bg-primary text-on-primary py-3 rounded-full font-label-md text-label-md font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-[20px]">shopping_cart</span>
                            Add to Cart
                        </button>
</div>
</div>
</div>
<div class="mt-8 text-center md:hidden">
<button class="bg-surface text-primary border-2 border-primary px-8 py-3 rounded-full font-label-md text-label-md font-bold hover:bg-primary hover:text-on-primary transition-colors">
                    View All Products
                </button>
</div>
</section>
</main>
<!-- Floating WhatsApp Button -->
<a class="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-[#25D366] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50" href="#">
<svg class="w-8 h-8" fill="currentColor" viewbox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964 1.003-3.588c-.608-1.065-.929-2.292-.929-3.545 0-4.05 3.295-7.345 7.345-7.345s7.345 3.295 7.345 7.345-3.295 7.345-7.345 7.345z"></path></svg>
</a>
<!-- Footer Component from JSON -->
<footer class="bg-surface-container-low dark:bg-surface-dim border-t border-outline-variant/30 full-width w-full px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col md:flex-row justify-between items-start gap-gutter">
<div class="flex flex-col gap-4">
<span class="text-headline-md font-headline-md font-extrabold text-primary dark:text-inverse-primary">Smitox Marketplace</span>
<p class="text-body-md font-body-md text-on-surface-variant">© 2024 Smitox Marketplace. A MomsGenie Partner.</p>
</div>
<div class="flex flex-wrap gap-x-8 gap-y-4">
<a class="text-label-md font-label-md text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors" href="#">About Us</a>
<a class="text-label-md font-label-md text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors" href="#">Bulk Ordering</a>
<a class="text-label-md font-label-md text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors" href="#">Shipping Policy</a>
<a class="text-label-md font-label-md text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors" href="#">Contact Support</a>
<a class="text-label-md font-label-md text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors" href="#">Privacy</a>
</div>
</footer>
</body></html>


and


<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Smitox Marketplace - Friendly Wholesale</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&amp;family=Plus+Jakarta+Sans:wght@700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-secondary-fixed-variant": "#85145a",
                        "surface": "#f8f9ff",
                        "surface-container-high": "#dfe9fa",
                        "error-container": "#ffdad6",
                        "tertiary-container": "#956e00",
                        "on-tertiary-fixed": "#261a00",
                        "inverse-primary": "#8ecdff",
                        "outline-variant": "#bfc7d1",
                        "on-secondary": "#ffffff",
                        "surface-tint": "#006494",
                        "surface-dim": "#d1dbec",
                        "primary-container": "#007bb5",
                        "on-primary-container": "#fcfcff",
                        "on-primary-fixed": "#001e30",
                        "tertiary-fixed": "#ffdf9f",
                        "error": "#ba1a1a",
                        "secondary-fixed": "#ffd8e7",
                        "secondary-container": "#fc79bd",
                        "surface-bright": "#f8f9ff",
                        "on-secondary-container": "#76014e",
                        "surface-container-low": "#eef4ff",
                        "surface-container": "#e5eeff",
                        "inverse-surface": "#27313e",
                        "on-secondary-fixed": "#3d0026",
                        "on-background": "#121c28",
                        "primary": "#006191",
                        "secondary": "#a43073",
                        "on-primary-fixed-variant": "#004b71",
                        "on-tertiary": "#ffffff",
                        "surface-container-lowest": "#ffffff",
                        "on-surface-variant": "#3f4850",
                        "primary-fixed": "#cbe6ff",
                        "secondary-fixed-dim": "#ffafd3",
                        "on-surface": "#121c28",
                        "primary-fixed-dim": "#8ecdff",
                        "on-primary": "#ffffff",
                        "inverse-on-surface": "#eaf1ff",
                        "tertiary": "#765700",
                        "tertiary-fixed-dim": "#f9bd22",
                        "on-tertiary-fixed-variant": "#5c4300",
                        "background": "#f8f9ff",
                        "outline": "#6f7881",
                        "on-error-container": "#93000a",
                        "surface-variant": "#d9e3f4",
                        "surface-container-highest": "#d9e3f4",
                        "on-tertiary-container": "#fffbff",
                        "on-error": "#ffffff"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-md": "24px",
                        "margin-desktop": "40px",
                        "margin-mobile": "16px",
                        "base": "8px",
                        "stack-sm": "12px",
                        "container-max": "1280px",
                        "stack-lg": "48px",
                        "gutter": "24px"
                    },
                    "fontFamily": {
                        "headline-xl": ["Plus Jakarta Sans"],
                        "label-md": ["Be Vietnam Pro"],
                        "body-md": ["Be Vietnam Pro"],
                        "label-sm": ["Be Vietnam Pro"],
                        "headline-lg": ["Plus Jakarta Sans"],
                        "headline-md": ["Plus Jakarta Sans"],
                        "headline-lg-mobile": ["Plus Jakarta Sans"],
                        "body-lg": ["Be Vietnam Pro"]
                    },
                    "fontSize": {
                        "headline-xl": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "800" }],
                        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.02em", "fontWeight": "600" }],
                        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "700" }],
                        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
                        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "700" }],
                        "headline-lg-mobile": ["28px", { "lineHeight": "34px", "fontWeight": "700" }],
                        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }]
                    }
                }
            }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .hero-wave {
            background: linear-gradient(135deg, #a43073 0%, #fc79bd 100%);
            mask-image: radial-gradient(ellipse at bottom, transparent 30%, black 70%);
            -webkit-mask-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg"><path fill="black" d="M0,160L48,176C96,192,192,224,288,208C384,192,480,128,576,128C672,128,768,192,864,213.3C960,235,1056,213,1152,176C1248,139,1344,85,1392,58.7L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path></svg>');
            -webkit-mask-size: cover;
            -webkit-mask-position: bottom;
            -webkit-mask-repeat: no-repeat;
        }
    </style>
</head>
<body class="bg-surface text-on-surface font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
<!-- Promotional Banner -->
<div class="bg-secondary-fixed text-on-secondary-fixed flex justify-between items-center px-margin-mobile md:px-margin-desktop py-2 text-label-sm font-label-sm">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-[16px]">close</span>
<span class="font-bold text-secondary">MomsGenie</span>
<span>For Smoother &amp; Faster Checkout &amp; <span class="text-secondary font-bold">Exclusive Offers</span></span>
</div>
<button class="border-2 border-secondary text-secondary rounded-full px-4 py-1 hover:bg-secondary hover:text-on-secondary transition-colors">Install App</button>
</div>
<!-- Shipping Banner -->
<div class="bg-primary text-on-primary text-center py-2 text-label-sm font-label-sm">
        hyperlocal, ₹749 for wider Gurgaon &amp; ₹949 for others!
    </div>
<!-- TopNavBar -->
<nav class="bg-primary dark:bg-primary-container text-on-primary dark:text-on-primary-container shadow-md docked full-width top-0 sticky z-50 flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4">
<!-- Logo -->
<div class="text-headline-md font-headline-md font-extrabold text-on-primary dark:text-on-primary-container flex-shrink-0">
            Smitox Marketplace
        </div>
<!-- Search -->
<div class="flex-1 max-w-2xl mx-gutter relative hidden md:block">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
<input class="w-full bg-surface text-on-surface rounded-full py-3 pl-12 pr-4 border-none focus:ring-2 focus:ring-primary-container shadow-sm placeholder:text-outline-variant font-body-md text-body-md" placeholder="Search for products" type="text"/>
</div>
<!-- Actions -->
<div class="flex items-center gap-4 flex-shrink-0">
<button aria-label="shopping_cart" class="p-2 rounded-full hover:bg-white/10 transition-colors">
<span class="material-symbols-outlined text-on-primary" data-icon="shopping_cart">shopping_cart</span>
</button>
<button aria-label="account_circle" class="p-2 rounded-full hover:bg-white/10 transition-colors">
<span class="material-symbols-outlined text-on-primary" data-icon="account_circle">account_circle</span>
</button>
<button class="bg-on-primary text-primary font-label-md text-label-md px-6 py-2 rounded-full hover:opacity-90 transition-opacity ml-2">
                Login
            </button>
</div>
</nav>
<!-- Sub Navigation -->
<div class="bg-surface-container-high py-3 overflow-x-auto hidden md:block">
<div class="max-w-container-max mx-auto px-margin-desktop flex justify-between items-center whitespace-nowrap gap-gutter">
<a class="text-on-surface font-label-md text-label-md hover:text-primary transition-colors flex items-center gap-1 font-bold" href="#">
                All Categories <span class="material-symbols-outlined text-[18px]">expand_more</span>
</a>
<a class="text-on-surface font-label-md text-label-md hover:text-primary transition-colors" href="#">Gifts &amp; Toys</a>
<a class="text-on-surface font-label-md text-label-md hover:text-primary transition-colors" href="#">Stationery</a>
<a class="text-on-surface font-label-md text-label-md hover:text-primary transition-colors font-bold text-primary" href="#">Summer Special</a>
<a class="text-on-surface font-label-md text-label-md hover:text-primary transition-colors" href="#">Art &amp; Craft</a>
<a class="text-on-surface font-label-md text-label-md hover:text-primary transition-colors" href="#">Books</a>
<a class="text-on-surface font-label-md text-label-md hover:text-primary transition-colors" href="#">Bottles &amp; Mugs</a>
</div>
</div>
<!-- Mobile Search (Visible only on small screens) -->
<div class="p-margin-mobile md:hidden bg-primary pb-4">
<div class="relative">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
<input class="w-full bg-surface text-on-surface rounded-full py-3 pl-12 pr-4 border-none focus:ring-2 focus:ring-primary-container shadow-sm font-body-md text-body-md" placeholder="Search..." type="text"/>
</div>
</div>
<!-- Main Content Canvas -->
<main class="w-full pb-stack-lg">
<!-- Hero Section -->
<section class="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-tertiary-fixed-dim">
<!-- Decorative Wave Background -->
<div class="absolute inset-0 z-0">
<svg class="absolute bottom-0 w-full h-full text-secondary" fill="currentColor" preserveaspectratio="none" viewbox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
<path d="M0,160L48,176C96,192,192,224,288,208C384,192,480,128,576,128C672,128,768,192,864,213.3C960,235,1056,213,1152,176C1248,139,1344,85,1392,58.7L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
</svg>
</div>
<div class="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop h-full flex items-center justify-between">
<!-- Hero Content -->
<div class="max-w-lg text-on-primary">
<h1 class="text-headline-lg-mobile md:text-headline-xl font-headline-lg-mobile md:font-headline-xl text-on-secondary mb-4 drop-shadow-md">
                        Creative Crafts for <br/> Imaginative Young Artists!
                    </h1>
<p class="text-body-lg font-body-lg text-on-secondary/90 mb-8 max-w-md">
                        Discover our charming assortment of arts and crafts supplies for kids and get them sent directly to your home.
                    </p>
<button class="bg-surface text-secondary font-label-md text-label-md px-8 py-3 rounded-full hover:bg-surface-variant transition-colors shadow-lg">
                        Explore Now
                    </button>
</div>
<!-- Hero Imagery Area (Placeholder for actual product/graphics) -->
<div class="hidden md:block w-1/2 h-full relative">
<!-- Abstract representation of the craft supplies in the image -->
<div class="absolute right-10 top-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-secondary-container rounded-[40px] rotate-3 shadow-xl flex items-center justify-center border-4 border-surface overflow-hidden">
<img alt="A vibrant collection of children's art supplies including paints, brushes, and colorful paper arranged creatively on a clean, bright surface. The lighting is soft and cheerful, highlighting the playful, modern design aesthetic suitable for a high-end kids' craft store. The colors are predominantly joyful pinks, bright yellows, and crisp whites." class="w-full h-full object-cover opacity-90 mix-blend-multiply" data-alt="A vibrant collection of children's art supplies including paints, brushes, and colorful paper arranged creatively on a clean, bright surface. The lighting is soft and cheerful, highlighting the playful, modern design aesthetic suitable for a high-end kids' craft store. The colors are predominantly joyful pinks, bright yellows, and crisp whites." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7-ozrE4Wr7TaH29OUlyy2TxMzfo0tGV7r4fZyec66DFHquepIROLNXMe_N0i53As5Tsw-hhANLCMa7faV15MdktHGeP_fbKp9YwQprColul04f4js89b_D_DKt5JIYpSLz0aM_sj6bJ4UIi0zUJ2O3IIzjornKnZRU9ZRTpu8H7wqSpBRO81JLM6IUdKfqakMSSOwmNYf6Ohoo8piIAlUvy39tcd8YuBs01WgMGcG-KJpMl0dovye1LjiB4Z317P0tIIoICRE4Bz8"/>
</div>
<!-- Sale Badge -->
<div class="absolute top-20 right-80 bg-[#ff0000] text-white w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg transform -rotate-12">
<span class="font-headline-md text-headline-md leading-none">50%</span>
<span class="font-label-sm text-label-sm uppercase tracking-wider">OFF</span>
</div>
</div>
</div>
</section>
<!-- Categories Section -->
<section class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-stack-lg">
<h2 class="text-headline-md font-headline-md text-on-surface mb-stack-md italic">Explore Categories</h2>
<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-gutter">
<!-- Category 1 -->
<a class="group flex flex-col items-center gap-3" href="#">
<div class="w-full aspect-square bg-secondary-fixed rounded-[24px] flex items-center justify-center p-4 transition-transform group-hover:scale-105 shadow-sm border border-secondary-fixed-dim/30 overflow-hidden relative">
<img alt="A soft, plush teddy bear sitting neatly amidst a clean, brightly lit, pastel-colored environment. The setting is minimalist and modern, focusing entirely on the high-quality, comforting texture of the toy. The lighting is diffused and warm, perfect for a premium children's product catalog." class="w-full h-full object-contain mix-blend-multiply" data-alt="A soft, plush teddy bear sitting neatly amidst a clean, brightly lit, pastel-colored environment. The setting is minimalist and modern, focusing entirely on the high-quality, comforting texture of the toy. The lighting is diffused and warm, perfect for a premium children's product catalog." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeHuJkKwpSAfGI1MVULpWWa-Q8V5BkRrS9UdxihFte5zo7g8rctYDCtzBFKII7IpXymLCHVuDI2W31i1vMcpgPQlJOXTmsBwhRPYUJ4PCLTNfhNqBXcFYQKMB5rZH4cfGmW7n-Z_Ot9pDhU0nXy0_TWYsnQyNtEmokQaaXgHK4qbo03R53ZMz1epfqJJkEUR6c-Y67a_DNmnA76dg7MesRBiTSUNKsdpeOfVQd1ywGSaTYz5-2xC-LHPA32610mEQS2B7jQ-1amuNQ"/>
</div>
<span class="font-label-md text-label-md text-on-surface text-center">Gifts &amp; Toys</span>
</a>
<!-- Category 2 -->
<a class="group flex flex-col items-center gap-3" href="#">
<div class="w-full aspect-square bg-primary-fixed rounded-[24px] flex items-center justify-center p-4 transition-transform group-hover:scale-105 shadow-sm border border-primary-fixed-dim/30 overflow-hidden relative">
<img alt="A colorful array of high-quality stationery items, including gel pens, notebooks, and erasers, arranged neatly on a light blue background. The aesthetic is clean, modern, and highly organized, emphasizing the playful yet functional nature of the products. Bright, even lighting enhances the vibrant colors of the stationery." class="w-full h-full object-contain mix-blend-multiply" data-alt="A colorful array of high-quality stationery items, including gel pens, notebooks, and erasers, arranged neatly on a light blue background. The aesthetic is clean, modern, and highly organized, emphasizing the playful yet functional nature of the products. Bright, even lighting enhances the vibrant colors of the stationery." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDenm1CiyhH1sAW4ZQJJAEGAVvtY1vCfRdeIRxbBG4-N9E8-JfNx1_tWvdq46phLlqNu3TVmhWgRgwWu8LNTWbxpNidQxDGhHqM4TE5_qfLuZ9A_JPHRUipuPcGgKVN9PN9qhcwjebGea-rLBEeJuSJl9YGUbguao3qMRgHWmF0Y0pYZAVkyYlE41tEPysbUZNJOGXY00AP0lJlqev9PSG3MY_zeoZ7_Id97zSlq-vujCD0XJKa-H6bQNvlJRhO1B87eNTZ89-S5J-x"/>
</div>
<span class="font-label-md text-label-md text-on-surface text-center">Stationery</span>
</a>
<!-- Category 3 -->
<a class="group flex flex-col items-center gap-3" href="#">
<div class="w-full aspect-square bg-tertiary-fixed rounded-[24px] flex items-center justify-center p-4 transition-transform group-hover:scale-105 shadow-sm border border-tertiary-fixed-dim/30 overflow-hidden relative">
<img alt="A collection of summer-themed children's accessories, such as a straw hat, colorful sunglasses, and a small beach ball, styled on a warm, sandy-toned background. The lighting is bright and sunny, evoking a cheerful, vacation-ready mood suitable for a summer special collection." class="w-full h-full object-contain mix-blend-multiply" data-alt="A collection of summer-themed children's accessories, such as a straw hat, colorful sunglasses, and a small beach ball, styled on a warm, sandy-toned background. The lighting is bright and sunny, evoking a cheerful, vacation-ready mood suitable for a summer special collection." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAF4gpADkZv5RveCACAcT3JPxB4YNKmQtJm0FWroPwiCUwJNHXN2Q8vK2vfp7-2eTF-0rheYwvm5frjOk7fXsIYWvn-rkjLfhIW3ILbzphDofLKUJUMVAGnLt911C9HZ_O6DvBSeo9LDWf1Ytkt-8Po3CFNhV7bAgMWBV90IyPEJAiutQpkl3783thb_m7mMN6L3YOr--YZN6Oe8xzS9vLIUzt0hMTZt19i6cQ-HwR24innrRdGnFSho_PYzRUeTw-PpYYjr3Smog7K"/>
</div>
<span class="font-label-md text-label-md text-on-surface text-center">Summer Special</span>
</a>
<!-- Category 4 -->
<a class="group flex flex-col items-center gap-3" href="#">
<div class="w-full aspect-square bg-surface-container-high rounded-[24px] flex items-center justify-center p-4 transition-transform group-hover:scale-105 shadow-sm border border-outline-variant/30 overflow-hidden relative">
<img alt="A small wooden easel displaying a blank canvas, surrounded by vibrant paint tubes and brushes in a clean, modern studio setting. The lighting is crisp and natural, highlighting the textures of the art materials and creating an inspiring, creative atmosphere." class="w-full h-full object-contain mix-blend-multiply" data-alt="A small wooden easel displaying a blank canvas, surrounded by vibrant paint tubes and brushes in a clean, modern studio setting. The lighting is crisp and natural, highlighting the textures of the art materials and creating an inspiring, creative atmosphere." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhiSUcNcELDTmQfjvVzFXZWCaW2HfGPMPDUCjRHag7qFnZmYnZvTQ-KVGmYxyGec5nTefL6sQW7Hm5txjto-FKTlVtplON3_0Exmc4YBzVDLNECQEKoXWJ0pmc1f0R_nEV1QV9t1oRyS6_JYnL2OsKF2PXNuVZvuR6W4fGrUYTZydlYTrE935ijWb8M6mZF8WPbHr2IXT1bzqSP1KU023VvXdxYVuKumRLXyN_MIFUXb_UotnIadQwbaeoyRbEcsUjx6heG-sfxm11"/>
</div>
<span class="font-label-md text-label-md text-on-surface text-center">Art &amp; Craft</span>
</a>
<!-- Category 5 -->
<a class="group flex flex-col items-center gap-3" href="#">
<div class="w-full aspect-square bg-secondary-fixed rounded-[24px] flex items-center justify-center p-4 transition-transform group-hover:scale-105 shadow-sm border border-secondary-fixed-dim/30 overflow-hidden relative">
<img alt="A neat stack of brightly colored children's books on a pure white, softly lit background. The covers feature playful illustrations, and the overall composition is minimalist and inviting, focusing on the joy of reading. The lighting is bright and even, ensuring high contrast and clarity." class="w-full h-full object-contain mix-blend-multiply" data-alt="A neat stack of brightly colored children's books on a pure white, softly lit background. The covers feature playful illustrations, and the overall composition is minimalist and inviting, focusing on the joy of reading. The lighting is bright and even, ensuring high contrast and clarity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAu8APlc6aHLJRkqSCk3LGTRTTZJ2bFZ7dbJRZxULOTWL7a5Pw9GSwjnt3vmtHrY7JW12X1YKV_hAVRUyO9Ij4kOMjb417SWoAR3_C8iv-l0xB2fnSBeCHxtdUuzMYbXoFerig4ZjHt9lgtvRvWS-GoXcdtGjO-ScRMOsvLldgmPgfH5Eaz5-BjtZfy1f1apKsHnqMz2RXhzn-EEXIGz3HyQzlVfs-PyRGOKSleOXyvawUikvpsh_0w5mBJ4NNKw5DIMqGPVO4u1X4"/>
</div>
<span class="font-label-md text-label-md text-on-surface text-center">Books</span>
</a>
<!-- Category 6 -->
<a class="group flex flex-col items-center gap-3" href="#">
<div class="w-full aspect-square bg-primary-fixed rounded-[24px] flex items-center justify-center p-4 transition-transform group-hover:scale-105 shadow-sm border border-primary-fixed-dim/30 overflow-hidden relative">
<img alt="Colorful, patterned children's water bottles standing upright on a clean, pastel blue surface. The bottles have playful designs and flip-top lids. The lighting is bright and reflective, giving the bottles a clean, premium look suitable for a modern e-commerce display." class="w-full h-full object-contain mix-blend-multiply" data-alt="Colorful, patterned children's water bottles standing upright on a clean, pastel blue surface. The bottles have playful designs and flip-top lids. The lighting is bright and reflective, giving the bottles a clean, premium look suitable for a modern e-commerce display." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyn4QS-yJIIEED0RlzZ_l8arFHNpsVHQ7b0wqZvJ39hcqNUIgFZCfLEmYSc8wFboJUxVTNKMOvwA68LUYZWZLuWLpdLjsHbvDpZBI38CKdwWk2pMiBKZsW6BPCcPzU7j3-rWW8HMZSsL5fKomYC3uKaUt1tC4XAeOWUwr6jEQII3KMDUkYZzSKOW6GoMqkvJboKUWd0jcNFBkd6H2xpvxola_VdJSx4s32LEZQrKDrbFY4WukDsD-lmGoE1BoJdhvdNFjwHO2r6rcr"/>
</div>
<span class="font-label-md text-label-md text-on-surface text-center">Bottles &amp; Mugs</span>
</a>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-surface-container-low dark:bg-surface-dim border-t border-outline-variant/30 w-full px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col md:flex-row justify-between items-start gap-gutter text-primary dark:text-inverse-primary font-body-md text-body-md">
<div class="flex flex-col gap-4 max-w-sm">
<span class="text-headline-md font-headline-md font-extrabold text-primary dark:text-inverse-primary">
                Smitox Marketplace
            </span>
<p class="text-on-surface-variant font-label-md text-label-md">
                © 2024 Smitox Marketplace. A MomsGenie Partner.
            </p>
</div>
<div class="flex flex-wrap gap-x-8 gap-y-4">
<a class="text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors font-label-md text-label-md" href="#">About Us</a>
<a class="text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors font-label-md text-label-md" href="#">Bulk Ordering</a>
<a class="text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors font-label-md text-label-md" href="#">Shipping Policy</a>
<a class="text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors font-label-md text-label-md" href="#">Contact Support</a>
<a class="text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors font-label-md text-label-md" href="#">Privacy</a>
</div>
</footer>
<!-- Floating WhatsApp Button (Simulated based on image) -->
<a class="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-50 flex items-center justify-center" href="#">
<svg class="w-8 h-8" fill="currentColor" viewbox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path></svg>
</a>
</body></html>

and

<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Smitox Marketplace - Modern Simple Variant</title>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&amp;family=Plus+Jakarta+Sans:wght@500;700;800&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Tailwind Config injected from system prompt -->
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-secondary-fixed-variant": "#85145a",
                        "surface": "#f8f9ff",
                        "surface-container-high": "#dfe9fa",
                        "error-container": "#ffdad6",
                        "tertiary-container": "#956e00",
                        "on-tertiary-fixed": "#261a00",
                        "inverse-primary": "#8ecdff",
                        "outline-variant": "#bfc7d1",
                        "on-secondary": "#ffffff",
                        "surface-tint": "#006494",
                        "surface-dim": "#d1dbec",
                        "primary-container": "#007bb5",
                        "on-primary-container": "#fcfcff",
                        "on-primary-fixed": "#001e30",
                        "tertiary-fixed": "#ffdf9f",
                        "error": "#ba1a1a",
                        "secondary-fixed": "#ffd8e7",
                        "secondary-container": "#fc79bd",
                        "surface-bright": "#f8f9ff",
                        "on-secondary-container": "#76014e",
                        "surface-container-low": "#eef4ff",
                        "surface-container": "#e5eeff",
                        "inverse-surface": "#27313e",
                        "on-secondary-fixed": "#3d0026",
                        "on-background": "#121c28",
                        "primary": "#006191",
                        "secondary": "#a43073",
                        "on-primary-fixed-variant": "#004b71",
                        "on-tertiary": "#ffffff",
                        "surface-container-lowest": "#ffffff",
                        "on-surface-variant": "#3f4850",
                        "primary-fixed": "#cbe6ff",
                        "secondary-fixed-dim": "#ffafd3",
                        "on-surface": "#121c28",
                        "primary-fixed-dim": "#8ecdff",
                        "on-primary": "#ffffff",
                        "inverse-on-surface": "#eaf1ff",
                        "tertiary": "#765700",
                        "tertiary-fixed-dim": "#f9bd22",
                        "on-tertiary-fixed-variant": "#5c4300",
                        "background": "#f8f9ff",
                        "outline": "#6f7881",
                        "on-error-container": "#93000a",
                        "surface-variant": "#d9e3f4",
                        "surface-container-highest": "#d9e3f4",
                        "on-tertiary-container": "#fffbff",
                        "on-error": "#ffffff"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-md": "24px",
                        "margin-desktop": "40px",
                        "margin-mobile": "16px",
                        "base": "8px",
                        "stack-sm": "12px",
                        "container-max": "1280px",
                        "stack-lg": "48px",
                        "gutter": "24px"
                    },
                    "fontFamily": {
                        "headline-xl": ["Plus Jakarta Sans"],
                        "label-md": ["Be Vietnam Pro"],
                        "body-md": ["Be Vietnam Pro"],
                        "label-sm": ["Be Vietnam Pro"],
                        "headline-lg": ["Plus Jakarta Sans"],
                        "headline-md": ["Plus Jakarta Sans"],
                        "headline-lg-mobile": ["Plus Jakarta Sans"],
                        "body-lg": ["Be Vietnam Pro"]
                    },
                    "fontSize": {
                        "headline-xl": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "800"}],
                        "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.02em", "fontWeight": "600"}],
                        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                        "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "700"}],
                        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
                        "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "700"}],
                        "headline-lg-mobile": ["28px", {"lineHeight": "34px", "fontWeight": "700"}],
                        "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}]
                    }
                }
            }
        }
    </script>
<style>
        body {
            background-color: theme('colors.background');
            color: theme('colors.on-background');
            font-family: 'Be Vietnam Pro', sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        
        /* Ambient Shadows */
        .shadow-ambient-card {
            box-shadow: 0 8px 24px -4px rgba(37, 150, 215, 0.08), 0 4px 8px -4px rgba(37, 150, 215, 0.04);
        }
        .shadow-ambient-hover {
            box-shadow: 0 12px 32px -4px rgba(37, 150, 215, 0.12), 0 6px 12px -4px rgba(37, 150, 215, 0.06);
        }
        
        /* Soft Gradients */
        .bg-pastel-gradient-pink {
            background: linear-gradient(135deg, #FFF0F5 0%, #FFE4E1 100%);
        }
        .bg-pastel-gradient-blue {
            background: linear-gradient(135deg, #F0F8FF 0%, #E6E6FA 100%);
        }
        
        /* Hero SVG Mask */
        .hero-curve-bottom {
            clip-path: ellipse(150% 100% at 50% 0%);
        }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: theme('colors.surface-container-low');
        }
        ::-webkit-scrollbar-thumb {
            background: theme('colors.outline-variant');
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: theme('colors.primary');
        }
    </style>
</head>
<body class="min-h-screen flex flex-col">
<!-- Top Navigation Promo Banner -->
<div class="bg-secondary-fixed text-on-secondary-fixed text-center py-2 px-4 text-label-sm font-label-sm relative">
<span class="inline-block mr-2">For Smoother &amp; Faster Checkout &amp; <span class="text-secondary font-bold">Exclusive Offers</span></span>
<a class="absolute right-4 top-1/2 transform -translate-y-1/2 border border-secondary text-secondary rounded-full px-4 py-1 hover:bg-secondary hover:text-on-secondary transition-colors font-label-sm" href="#">Install App</a>
</div>
<div class="bg-primary text-on-primary text-center py-2 px-4 text-label-sm font-label-sm">
        hyperlocal, ₹749 for wider Gurgaon &amp; ₹949 for others!
    </div>
<!-- TopNavBar (Shared Component) -->
<header class="sticky top-0 z-50 flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 shadow-md bg-primary dark:bg-primary-container">
<!-- Logo -->
<a class="flex items-center gap-2" href="#">
<span class="text-headline-md font-headline-md font-extrabold text-on-primary dark:text-on-primary-container">Smitox Marketplace</span>
</a>
<!-- Desktop Navigation & Search -->
<div class="hidden md:flex items-center gap-8 flex-1 justify-end ml-8">
<nav class="flex items-center gap-6">
<!-- Navigation Items -->
<a class="text-on-primary/80 font-medium pb-1 hover:opacity-90 transition-opacity" href="#">Electronics</a>
<a class="text-on-primary/80 font-medium pb-1 hover:opacity-90 transition-opacity" href="#">Fashion</a>
<a class="text-on-primary font-bold border-b-2 border-on-primary pb-1 hover:opacity-90 transition-opacity" href="#">Home</a>
<a class="text-on-primary/80 font-medium pb-1 hover:opacity-90 transition-opacity" href="#">Toys</a>
<a class="text-on-primary/80 font-medium pb-1 hover:opacity-90 transition-opacity" href="#">Baby Care</a>
</nav>
<!-- Search Bar -->
<div class="relative w-64">
<input class="w-full bg-surface-container-highest text-on-surface rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-fixed focus:bg-surface-bright transition-all text-body-md font-body-md border-none placeholder-outline" placeholder="Search products..." type="text"/>
<span class="material-symbols-outlined absolute right-3 top-1/2 transform -translate-y-1/2 text-outline">search</span>
</div>
<!-- Actions -->
<div class="flex items-center gap-4 text-on-primary">
<button aria-label="Shopping Cart" class="hover:opacity-80 transition-opacity">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">shopping_cart</span>
</button>
<button aria-label="User Account" class="hover:opacity-80 transition-opacity">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">account_circle</span>
</button>
<button class="bg-surface text-primary px-6 py-2 rounded-full font-label-md hover:bg-surface-variant transition-colors shadow-sm">
                    Login
                </button>
</div>
</div>
<!-- Mobile Menu Toggle (Simplified) -->
<button class="md:hidden text-on-primary">
<span class="material-symbols-outlined">menu</span>
</button>
</header>
<!-- Sub Navigation Categories -->
<div class="bg-surface-container-low border-b border-surface-variant py-3 px-margin-mobile md:px-margin-desktop overflow-x-auto whitespace-nowrap hide-scrollbar">
<div class="max-w-[1280px] mx-auto flex items-center justify-between gap-6 min-w-max text-label-md font-label-md text-on-surface-variant">
<button class="flex items-center gap-1 font-bold text-on-surface hover:text-primary transition-colors">
                All Categories <span class="material-symbols-outlined text-[18px]">expand_more</span>
</button>
<a class="hover:text-primary transition-colors" href="#">Gifts &amp; Toys</a>
<a class="hover:text-primary transition-colors" href="#">Stationery</a>
<a class="hover:text-primary transition-colors" href="#">Summer Special</a>
<a class="hover:text-primary transition-colors" href="#">Art &amp; Craft</a>
<a class="hover:text-primary transition-colors" href="#">Books</a>
<a class="hover:text-primary transition-colors" href="#">Bottles &amp; Mugs</a>
</div>
</div>
<!-- Main Content Canvas -->
<main class="flex-grow flex flex-col">
<!-- Hero Section (Bento Grid Style) -->
<section class="relative w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg mt-8">
<div class="grid grid-cols-1 md:grid-cols-12 gap-gutter h-[500px]">
<!-- Main Hero Panel (Left 8 cols) -->
<div class="md:col-span-8 bg-secondary rounded-[32px] overflow-hidden relative flex items-center p-8 md:p-12 shadow-ambient-card">
<!-- Decorative BG Elements -->
<div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: radial-gradient(circle at top right, theme('colors.secondary-fixed') 0%, transparent 60%);"></div>
<div class="absolute -bottom-20 -right-20 w-96 h-96 bg-secondary-container rounded-full blur-3xl opacity-30"></div>
<div class="relative z-10 max-w-lg">
<span class="inline-block px-4 py-1 bg-secondary-fixed text-on-secondary-fixed-variant rounded-full text-label-sm font-label-sm mb-4">Summer Special</span>
<h1 class="text-headline-xl font-headline-xl text-on-secondary mb-6 leading-tight">
                            Creative Crafts for<br/>
                            Imaginative Young Artists!
                        </h1>
<p class="text-body-lg font-body-lg text-on-secondary/90 mb-8 max-w-md">
                            Discover our charming assortment of arts and crafts supplies for kids and get them sent directly to your home.
                        </p>
<button class="bg-surface text-primary px-8 py-4 rounded-full font-label-md text-label-md hover:bg-surface-variant transition-transform hover:-translate-y-1 shadow-lg flex items-center gap-2">
                            Explore Now
                            <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
</button>
</div>
<!-- Hero Image Area (Right side of this panel) -->
<div class="absolute right-0 bottom-0 top-0 w-1/2 pointer-events-none hidden md:block">
<img alt="Art Supplies" class="w-full h-full object-cover mix-blend-overlay opacity-80" data-alt="A vibrant collection of high-quality children's art supplies arranged on a clean, light surface. The scene features bright paint pots, a miniature wooden easel holding a blank canvas, colorful brushes, and craft paper in a modern, well-lit setting. The mood is joyful, creative, and inspiring, emphasizing a premium educational aesthetic suitable for a parent-focused e-commerce platform. High contrast lighting with soft shadows." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqh8WBKcmbKivXr6dxEq0-7OV6bapo96gSYQh-mSH4j2guFik71TKj11nzIDzemRO43fF-R9HBBFCaKazc06gbDA0Xlb13-iLFp5JFEdHIRwvAqrF4Q4UXGKTk0LYMBiRLn02MyB350OltGATijalkzixh90KbWHeImaUe4z-TeAHklstaEJExgB0PDl5q4_EiKG-BKD8q4Js4oU4D3Y3hWiEBVe1LU2-5eotypQL7UCp70D9wlmBtwkR4alxRXzfpkfBVVX7dOHZq"/>
</div>
</div>
<!-- Side Panels (Right 4 cols) -->
<div class="md:col-span-4 grid grid-rows-2 gap-gutter h-full">
<!-- Top Side Panel -->
<div class="bg-surface-container-high rounded-[24px] p-6 shadow-ambient-card relative overflow-hidden flex flex-col justify-center items-start hover:shadow-ambient-hover transition-shadow group">
<div class="absolute right-[-20px] top-[-20px] w-32 h-32 bg-primary-container/20 rounded-full blur-2xl group-hover:bg-primary-container/30 transition-colors"></div>
<h3 class="text-headline-md font-headline-md text-on-surface mb-2 relative z-10">3,000+ smiles<br/>&amp; counting</h3>
<p class="text-body-md font-body-md text-on-surface-variant mb-4 relative z-10">Trusted by parents everywhere.</p>
<a class="text-primary font-label-md text-label-md flex items-center gap-1 hover:underline relative z-10" href="#">
                            Read Reviews <span class="material-symbols-outlined text-[16px]">chevron_right</span>
</a>
<img alt="Smiling kid" class="absolute bottom-0 right-0 w-24 h-24 object-cover rounded-tl-full opacity-60 mix-blend-multiply" data-alt="A close-up shot of a happy child's hands creating a colorful finger-painting on clean white paper. The scene is brightly lit with a soft, cheerful mood, highlighting the joy of creative play. The colors are vibrant and the focus is sharp on the hands and paint, representing trust, discovery, and safety in a family-oriented e-commerce context." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuFx2KTalX8PnCkXnCTFgYICJSLG5inQZjvFByeIoBv9mZebpgUgq453xbmUn-F7q2EmPy99lCJtgizri95GUQlWiguUsIYNmT3P4ZsnN_jqBhPYOgGSTHNrvf56EP77RIVLLUpYWsdTLBgjKeG0oM8GQ7cCkW1el56ILWxVYct7soxYylhxVkyuilI_HPzoAublwkoOp8rqa_gmR410JoQZcqBZf5VGjRWNnrepwc8BqThxAQX4brZMAL9RsSgkEAYkwkS23kPgPc"/>
</div>
<!-- Bottom Side Panel (Sale Promo) -->
<div class="bg-primary-container rounded-[24px] p-6 shadow-ambient-card relative overflow-hidden flex flex-col justify-between group">
<div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&amp;w=400&amp;auto=format&amp;fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" data-alt="Abstract colorful background featuring soft, blurred geometric shapes in warm and cool pastel tones, resembling stacked toy blocks or craft paper. The lighting is diffused and pleasant, creating a subtle texture that serves as an engaging backdrop without overwhelming the foreground content. Clean, airy aesthetic."></div>
<div class="relative z-10">
<span class="inline-block bg-error text-on-error px-3 py-1 rounded-md text-label-sm font-label-sm font-bold uppercase tracking-wider mb-2">Flash Sale</span>
<h3 class="text-headline-lg font-headline-lg text-on-primary-container mb-1">50% OFF</h3>
<p class="text-body-md font-body-md text-on-primary-container/80">On selected art kits.</p>
</div>
<button class="relative z-10 mt-auto bg-on-primary-container text-primary-container w-full py-3 rounded-xl font-label-md text-label-md hover:bg-surface transition-colors shadow-sm">
                            Shop Sale
                        </button>
</div>
</div>
</div>
</section>
<!-- Category Grid Section -->
<section class="w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
<div class="flex justify-between items-end mb-8">
<div>
<h2 class="text-headline-lg font-headline-lg text-on-surface mb-2">Explore Categories</h2>
<p class="text-body-md font-body-md text-on-surface-variant">Find the perfect spark for their imagination.</p>
</div>
<a class="hidden md:flex items-center gap-2 text-primary font-label-md text-label-md hover:text-primary-fixed-variant transition-colors" href="#">
                    View All <span class="material-symbols-outlined">arrow_forward</span>
</a>
</div>
<!-- Horizontal Scrollable Grid for Categories -->
<div class="flex overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 gap-6 hide-scrollbar snap-x">
<!-- Category 1 -->
<a class="snap-start flex-shrink-0 w-32 md:w-40 flex flex-col items-center group" href="#">
<div class="w-32 h-32 md:w-40 md:h-40 bg-surface-container rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-sm border border-surface-variant overflow-hidden p-4">
<img alt="Toys" class="w-full h-full object-contain mix-blend-multiply" data-alt="A soft, plush teddy bear sitting neatly next to a stack of brightly colored, smooth wooden building blocks on a pristine white background. The lighting is studio-quality, casting soft, ambient shadows that emphasize the tactile softness of the bear and the smooth finish of the blocks. The composition is clean, airy, and inviting, perfectly suited for a premium children's toy category icon." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwPh9cTTaqbp9xstK6WHIeouveEP4qmnrT8vNvF6umF3WN1yQmbmNYjl0JM_k5pvW3z6K1IreXJKzARvWT6EqUqIeaP-TnbqQz2Zd7EV8mXvyfycWC-1ArC7jbQNALOsD6AcWM0UPfSrgOVB0T9AxgUsl841Xo_QBkioDNDeFFbi28RWWw_U-0JsOJge5zKHYnp8tbcpEG84txymsKJM19oQoyABSnl_0o7iqFMw0oStMOU_5Slaz2IVxJEFfLjgFDJX50hpyDORRk"/>
</div>
<span class="text-label-md font-label-md text-on-surface group-hover:text-primary transition-colors text-center">Gifts &amp; Toys</span>
</a>
<!-- Category 2 -->
<a class="snap-start flex-shrink-0 w-32 md:w-40 flex flex-col items-center group" href="#">
<div class="w-32 h-32 md:w-40 md:h-40 bg-surface-container rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-sm border border-surface-variant overflow-hidden p-4">
<img alt="Stationery" class="w-full h-full object-contain mix-blend-multiply" data-alt="A highly organized, aesthetically pleasing arrangement of premium stationery items, including pastel-colored notebooks, fine-liner pens, and a sleek modern pencil case, laid out flat on a light grey surface. The lighting is bright and even, creating a minimalist and professional yet playful mood. Generous whitespace surrounds the items, emphasizing clarity and modern design." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPfZ7Ntso46YrN-EcQBvVAGyoZ0FGZH60aDNmtkxcQ1RtEmsJrdvC3qL1qAWWnFuK__IQ-Sbw5CaEBz-CcUJmBLhBH6f3C_7ZOMyVpwDXSF8M0E_wCcDOchlJfUcHQyW_0bPZZcTU50GZTIg6FE5w4nF6gk7hXImg9HSrqApi04IETbaw6wIVbK_VIYrFfRtOVBV0iaY8nYlkdl2hpaJP14J2t6X2F59S5HnCOxHN4bKmziDvYH6Ce8XnnOrMfOY0Wtng7n6N2canx"/>
</div>
<span class="text-label-md font-label-md text-on-surface group-hover:text-primary transition-colors text-center">Stationery</span>
</a>
<!-- Category 3 -->
<a class="snap-start flex-shrink-0 w-32 md:w-40 flex flex-col items-center group" href="#">
<div class="w-32 h-32 md:w-40 md:h-40 bg-surface-container rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-sm border border-surface-variant overflow-hidden p-4">
<img alt="Summer Special" class="w-full h-full object-contain mix-blend-multiply" data-alt="A curated collection of summer-themed children's accessories, including a small straw sun hat, colorful sunglasses, and a bright yellow sand bucket, arranged playfully on a clean, light pastel yellow background. The lighting mimics bright, cheerful summer sunshine with soft, defined shadows. The overall feel is warm, vibrant, and geared towards outdoor family fun." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBquHfNjVhQ1dotTL1MvmTTeIKWUSXjrBnIMX-zKKaCSUrJn72taBUwCeQlOyPlNDMN4KndRbX7rfIiGgyEect1hyhcc2IKDuUoxpSLNsVFzAZvvisQ2ZgpSwBT1CHYF2OtkU93jOS-1iMVYbBbx6OY6d51JPguZRAklK7_NmgAhDVnqf_J_lSVtTii3eOW9wuXEX8Q-sBJjUWJ-1CWRhIadpg4jwn04YIOj3xutXKPsPKpHTvW87ebhO7A8InqNE0sIkipS95FwLfN"/>
</div>
<span class="text-label-md font-label-md text-on-surface group-hover:text-primary transition-colors text-center">Summer Special</span>
</a>
<!-- Category 4 -->
<a class="snap-start flex-shrink-0 w-32 md:w-40 flex flex-col items-center group" href="#">
<div class="w-32 h-32 md:w-40 md:h-40 bg-surface-container rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-sm border border-surface-variant overflow-hidden p-4">
<img alt="Art &amp; Craft" class="w-full h-full object-contain mix-blend-multiply" data-alt="A neat cluster of art and craft supplies: a set of vibrant watercolor pans, a pristine white palette, and several natural bristle brushes resting on a clean, white studio surface. The lighting is soft and diffused, highlighting the texture of the brushes and the vivid colors of the paint. The aesthetic is clean, inspiring, and professional." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7sXJFXFtPxfWOVQC_PwHrKCtUJwPcF8AkyNfjr2uBsutjDrGt0oZNE0sP89LqvjA-L51_SX1ehHAyJuutxv41a_yDdaKeQteCEltxvcucsDB3PE3kYa_IewJIKbkVBHvceCOU3bBG8t6TGSCR3Q-bthGjuvxK-P0ktf_bSp-tPdctSgHMsh3ZRmlxCDcOHtKHBHFDE5oeld9IvM3S2gsQCSCn97OHUGWW3Zl96JUVD2LetkrqbbKZ71Up1r4zLcEaE6bcIS3wg4Qb"/>
</div>
<span class="text-label-md font-label-md text-on-surface group-hover:text-primary transition-colors text-center">Art &amp; Craft</span>
</a>
<!-- Category 5 -->
<a class="snap-start flex-shrink-0 w-32 md:w-40 flex flex-col items-center group" href="#">
<div class="w-32 h-32 md:w-40 md:h-40 bg-surface-container rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-sm border border-surface-variant overflow-hidden p-4">
<img alt="Books" class="w-full h-full object-contain mix-blend-multiply" data-alt="A neatly stacked pile of colorful children's storybooks with bright, engaging spines, resting on a soft, light-colored wooden table. A pair of small, stylish reading glasses sits atop the highest book. The lighting is warm and inviting, suggesting a cozy reading environment. The composition focuses on the educational and imaginative value of reading." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0qml2EqG_eLdtcMoGN2Zcrcn7HVp2bfMl-bxlU1yVxHnqLRDwxYKjbgSvSJwQ1znks3HOm8FS4zrg1Sc1Qo55w5bXuKuu0N44lh9NARcEpPH_MSiWkSr0EQsd5QPXLby3VC48Lqif8heCF52sNTr3q96p8IZF2g2qcQQrUbEKsODhmChQ6HB7kJbiDqsNYBLYdVEvx0kWz95E2CofTB5eS7HyTEP2hrEYNZeeo3WzluZ7mBKmwNtAKmndn31TxePcwzOio6aC_jtg"/>
</div>
<span class="text-label-md font-label-md text-on-surface group-hover:text-primary transition-colors text-center">Books</span>
</a>
<!-- Category 6 -->
<a class="snap-start flex-shrink-0 w-32 md:w-40 flex flex-col items-center group" href="#">
<div class="w-32 h-32 md:w-40 md:h-40 bg-surface-container rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-sm border border-surface-variant overflow-hidden p-4">
<img alt="Bottles &amp; Mugs" class="w-full h-full object-contain mix-blend-multiply" data-alt="Two modern, high-quality children's water bottles—one stainless steel with a sleek design and one durable, brightly colored plastic with a straw lid—standing upright on a clean, minimalist white background. Soft, studio lighting emphasizes the sleek forms and vibrant colors of the bottles, conveying durability, health, and premium utility." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHVNVwXQOUfktYVhVw3h8fvVxZMRLHA2LiH_FDFlR07vIM9iiJ3kuXf9DegArhj3ed9HqFQNjlzSXqOpiC716DDCJzXqgNnYOX2XoSy7gc6NWC1eVqSCQXarsTKbofWmTvoapesQnej1qdI3VQsFB_vTyIIueIZPLGXaYVsglH9geOXUZCxPXBA-AKb97BnjUveeEy3KaWCd8k9VP_0u2VCZT7B7L4hqBrPD1egCRkns12mZmamJpY2H6w7Mtz7tdQKuIZQ2Vo635y"/>
</div>
<span class="text-label-md font-label-md text-on-surface group-hover:text-primary transition-colors text-center">Bottles &amp; Mugs</span>
</a>
</div>
</section>
<!-- Featured Products Section -->
<section class="bg-surface-container-lowest w-full py-stack-lg border-t border-surface-variant">
<div class="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
<div class="flex justify-between items-end mb-8">
<div>
<h2 class="text-headline-lg font-headline-lg text-on-surface mb-2">Trending for Little Ones</h2>
<p class="text-body-md font-body-md text-on-surface-variant">Handpicked quality products, direct from verified suppliers.</p>
</div>
<div class="hidden md:flex gap-2">
<button class="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container hover:text-primary transition-colors">
<span class="material-symbols-outlined">arrow_back</span>
</button>
<button class="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container hover:text-primary transition-colors">
<span class="material-symbols-outlined">arrow_forward</span>
</button>
</div>
</div>
<!-- Product Grid -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-gutter">
<!-- Product Card 1 -->
<div class="bg-surface rounded-[24px] overflow-hidden shadow-ambient-card hover:shadow-ambient-hover transition-all duration-300 group border border-surface-variant border-opacity-50 flex flex-col h-full relative p-4">
<!-- Badges -->
<div class="absolute top-6 left-6 z-10 flex flex-col gap-2">
<span class="bg-primary-container text-on-primary-container px-2 py-1 rounded-md text-label-sm font-label-sm font-bold shadow-sm">Verified</span>
<span class="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border border-outline-variant/20">MOQ: 50</span>
</div>
<button class="absolute top-6 right-6 z-10 w-8 h-8 bg-surface rounded-full flex items-center justify-center shadow-sm text-outline hover:text-secondary transition-colors">
<span class="material-symbols-outlined text-[18px]">favorite</span>
</button>
<!-- Image -->
<div class="w-full aspect-square bg-surface-container-low rounded-xl mb-4 overflow-hidden relative">
<img alt="Premium Finger Paints" class="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" data-alt="A premium set of eco-friendly, non-toxic finger paints arranged neatly in their transparent jars on a clean, light wooden surface. The vibrant colors of the paint pop against the neutral background. Soft, natural lighting creates a warm, safe, and inviting mood, emphasizing the high quality and safety of the product intended for young children." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdy7Q48bEDh7epFr9phWswRhimc51e-FzxMbwsc55gV4yCMzepLmX5arUcAQkplAsnpFfqsGa8Wcy2Sa7cY0OdTMzk0WQ4BcUgwbSawqOHzseYTGUT5DrlsUDitduq5hep5zG_-pQ6oJ3TI5upd0P49xCqKiKCFIAqME7EYOpjFIoen1O0cCWtSLRmIjZQcRhEjg4KvT4MfhBMfW900Ko4P-lpIaXvchZmIF-bvMsbs3ht3M7Qv3F47SCgLrJLK6kw0nFmYnIWA6LZ"/>
</div>
<!-- Content -->
<div class="flex flex-col flex-grow">
<h4 class="text-body-md font-body-md font-bold text-on-surface line-clamp-2 mb-1 group-hover:text-primary transition-colors">Eco-Friendly Washable Finger Paints Set</h4>
<p class="text-label-sm font-label-sm text-on-surface-variant mb-3">Art &amp; Craft Supplies Co.</p>
<div class="mt-auto">
<div class="flex items-center gap-1 mb-2">
<span class="material-symbols-outlined text-tertiary-fixed-dim text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="text-label-sm font-label-sm text-on-surface font-bold">4.8</span>
<span class="text-label-sm font-label-sm text-outline">(124 reviews)</span>
</div>
<div class="flex items-end justify-between">
<div>
<span class="text-headline-md font-headline-md text-primary font-bold">₹249</span>
<span class="text-label-sm font-label-sm text-outline line-through ml-1">₹399</span>
</div>
<button class="w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center hover:bg-primary-fixed-variant transition-colors shadow-sm">
<span class="material-symbols-outlined text-[20px]">add_shopping_cart</span>
</button>
</div>
</div>
</div>
</div>
<!-- Product Card 2 -->
<div class="bg-surface rounded-[24px] overflow-hidden shadow-ambient-card hover:shadow-ambient-hover transition-all duration-300 group border border-surface-variant border-opacity-50 flex flex-col h-full relative p-4">
<div class="absolute top-6 left-6 z-10 flex flex-col gap-2">
<span class="bg-primary-container text-on-primary-container px-2 py-1 rounded-md text-label-sm font-label-sm font-bold shadow-sm">Verified</span>
<span class="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border border-outline-variant/20">MOQ: 20</span>
</div>
<button class="absolute top-6 right-6 z-10 w-8 h-8 bg-surface rounded-full flex items-center justify-center shadow-sm text-outline hover:text-secondary transition-colors">
<span class="material-symbols-outlined text-[18px]">favorite</span>
</button>
<div class="w-full aspect-square bg-surface-container-low rounded-xl mb-4 overflow-hidden relative">
<img alt="Interactive Pop-up Book" class="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" data-alt="A high-quality, beautifully illustrated children's pop-up book opened to a fascinating, colorful page featuring a jungle scene. The book rests on a clean, light grey tabletop. The lighting is crisp and even, highlighting the intricate details of the paper engineering and the vivid illustrations. The mood is magical, educational, and premium." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxCvx6LRMy4xggzm1_aj0TeLkim4EHMuTdgPRDBWgGlxz-WktSDgw7InM1t-BXCkOAU6mpqtPtlpJCuuBDEmrPT9hzieVKhpzux92hR30T5v6x5OXiOnwmIc1Y2ZEQ1iNnjZoKiMAqvHy8IMKLnWAQJ2EIbZyHF8FsZcv_nhCAhzSJv2wpfkQwKhG0rGifRuAcg-ZPc3-Pc1B4hFt7uidO_3jm01lRQ5cmXyODNVjvO4Vma_Niwq380siERv1VPw7mAzifnQ0bATKT"/>
</div>
<div class="flex flex-col flex-grow">
<h4 class="text-body-md font-body-md font-bold text-on-surface line-clamp-2 mb-1 group-hover:text-primary transition-colors">Interactive 'Jungle Safari' Pop-up Book</h4>
<p class="text-label-sm font-label-sm text-on-surface-variant mb-3">WonderKids Publishers</p>
<div class="mt-auto">
<div class="flex items-center gap-1 mb-2">
<span class="material-symbols-outlined text-tertiary-fixed-dim text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="text-label-sm font-label-sm text-on-surface font-bold">4.9</span>
<span class="text-label-sm font-label-sm text-outline">(89 reviews)</span>
</div>
<div class="flex items-end justify-between">
<div>
<span class="text-headline-md font-headline-md text-primary font-bold">₹450</span>
<span class="text-label-sm font-label-sm text-outline line-through ml-1">₹600</span>
</div>
<button class="w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center hover:bg-primary-fixed-variant transition-colors shadow-sm">
<span class="material-symbols-outlined text-[20px]">add_shopping_cart</span>
</button>
</div>
</div>
</div>
</div>
<!-- Product Card 3 -->
<div class="bg-surface rounded-[24px] overflow-hidden shadow-ambient-card hover:shadow-ambient-hover transition-all duration-300 group border border-surface-variant border-opacity-50 flex flex-col h-full relative p-4">
<div class="absolute top-6 left-6 z-10 flex flex-col gap-2">
<span class="bg-primary-container text-on-primary-container px-2 py-1 rounded-md text-label-sm font-label-sm font-bold shadow-sm">Verified</span>
<span class="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border border-outline-variant/20">MOQ: 100</span>
</div>
<span class="absolute top-6 right-6 z-10 bg-secondary text-on-secondary px-2 py-1 rounded-md text-label-sm font-label-sm font-bold shadow-sm">New</span>
<div class="w-full aspect-square bg-surface-container-low rounded-xl mb-4 overflow-hidden relative">
<img alt="Insulated Kids Water Bottle" class="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" data-alt="A stylish, modern insulated stainless steel water bottle designed for kids, featuring a subtle matte pastel pink finish and a secure, spill-proof lid. The bottle stands on a clean, white surface with a soft, diffused shadow. The lighting is bright and airy, communicating hygiene, durability, and a clean, contemporary aesthetic suitable for modern parents." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnwvZAdZLLfuamzLm2feTE7xVNHCz4F-iEpNaoxcIUtqNOHJZNhr-Ko_Snc6wX2k0FM3fkjs_Bv2oxBsEc2hRbx2JyiqJ3phyp4PBbmuarNzZwkvwQYwxi50KmfKhCR-ZIXBX8TnUhDvVGS6UinZxgzBlEcOJyY8unl_yrMZv1M9a77fpl7XeWAscK-iBkIoY7dezAQS3bQfjfKkk3oEGULDAsWr-BJF5sG_t8CH2mFAuJCJCPOuiW0ZMDyqznu3bZgcXh5--F4jr5"/>
</div>
<div class="flex flex-col flex-grow">
<h4 class="text-body-md font-body-md font-bold text-on-surface line-clamp-2 mb-1 group-hover:text-primary transition-colors">Premium Insulated Stainless Steel Sipper</h4>
<p class="text-label-sm font-label-sm text-on-surface-variant mb-3">SafeSip Essentials</p>
<div class="mt-auto">
<div class="flex items-center gap-1 mb-2">
<span class="material-symbols-outlined text-tertiary-fixed-dim text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="text-label-sm font-label-sm text-on-surface font-bold">5.0</span>
<span class="text-label-sm font-label-sm text-outline">(42 reviews)</span>
</div>
<div class="flex items-end justify-between">
<div>
<span class="text-headline-md font-headline-md text-primary font-bold">₹320</span>
</div>
<button class="w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center hover:bg-primary-fixed-variant transition-colors shadow-sm">
<span class="material-symbols-outlined text-[20px]">add_shopping_cart</span>
</button>
</div>
</div>
</div>
</div>
<!-- Product Card 4 -->
<div class="bg-surface rounded-[24px] overflow-hidden shadow-ambient-card hover:shadow-ambient-hover transition-all duration-300 group border border-surface-variant border-opacity-50 flex flex-col h-full relative p-4 hidden md:flex">
<div class="absolute top-6 left-6 z-10 flex flex-col gap-2">
<span class="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border border-outline-variant/20">MOQ: 10</span>
</div>
<button class="absolute top-6 right-6 z-10 w-8 h-8 bg-surface rounded-full flex items-center justify-center shadow-sm text-outline hover:text-secondary transition-colors">
<span class="material-symbols-outlined text-[18px]">favorite</span>
</button>
<div class="w-full aspect-square bg-surface-container-low rounded-xl mb-4 overflow-hidden relative">
<img alt="Wooden Dollhouse" class="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" data-alt="A large, beautifully crafted wooden dollhouse with intricate details, open to reveal furnished rooms painted in soft pastel colors. The dollhouse sits on a light wooden floor against a pristine white wall. The lighting is soft and natural, creating a warm, nostalgic, and high-quality mood that highlights the craftsmanship and play value of the toy." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxZztyduDRVSIhbHyDfnrS7S9Cl2X89o3MNDgxCu4tIuxUpOtX7bWERiWyKsHTMMQtbX-XiRh7822I1BR_l_gxW_-RFBRhz5Ez3Cu0g5BDl2nmumxEKN4bKov_ut_mYisNeVPDDlbI0xwunbLqaxwG-mnrG2dMNa3IwF5h-fLfyYj8_YyeTY0noo4opDGldQkSQv8o7qkTjuDyze6jdzM-mLecOGPjo3-hPxNnE6NfDF4vH1wI-XX0TNUMR1Xo5Y3_F0StNxY0Q8zZ"/>
</div>
<div class="flex flex-col flex-grow">
<h4 class="text-body-md font-body-md font-bold text-on-surface line-clamp-2 mb-1 group-hover:text-primary transition-colors">Handcrafted Classic Wooden Dollhouse</h4>
<p class="text-label-sm font-label-sm text-on-surface-variant mb-3">TimberToys Crafters</p>
<div class="mt-auto">
<div class="flex items-center gap-1 mb-2">
<span class="material-symbols-outlined text-tertiary-fixed-dim text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="text-label-sm font-label-sm text-on-surface font-bold">4.7</span>
<span class="text-label-sm font-label-sm text-outline">(215 reviews)</span>
</div>
<div class="flex items-end justify-between">
<div>
<span class="text-headline-md font-headline-md text-primary font-bold">₹1,850</span>
<span class="text-label-sm font-label-sm text-outline line-through ml-1">₹2,200</span>
</div>
<button class="w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center hover:bg-primary-fixed-variant transition-colors shadow-sm">
<span class="material-symbols-outlined text-[20px]">add_shopping_cart</span>
</button>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- Footer (Shared Component) -->
<footer class="w-full px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col md:flex-row justify-between items-start gap-gutter bg-surface-container-low dark:bg-surface-dim border-t border-outline-variant/30">
<!-- Brand & Copyright -->
<div class="flex flex-col gap-4">
<span class="text-headline-md font-headline-md font-extrabold text-primary dark:text-inverse-primary">Smitox Marketplace</span>
<p class="text-body-md font-body-md text-on-surface-variant max-w-xs">
                Your trusted B2B partner for premium kids' products. Quality sourced, safely delivered.
            </p>
<span class="text-label-sm font-label-sm text-on-surface-variant mt-4">
                © 2024 Smitox Marketplace. A MomsGenie Partner.
            </span>
</div>
<!-- Links -->
<div class="flex flex-wrap gap-x-12 gap-y-6">
<div class="flex flex-col gap-3">
<span class="text-label-md font-label-md font-bold text-primary dark:text-inverse-primary mb-1">Company</span>
<a class="text-body-md font-body-md text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors" href="#">About Us</a>
<a class="text-body-md font-body-md text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors" href="#">Contact Support</a>
</div>
<div class="flex flex-col gap-3">
<span class="text-label-md font-label-md font-bold text-primary dark:text-inverse-primary mb-1">Services</span>
<a class="text-body-md font-body-md text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors" href="#">Bulk Ordering</a>
<a class="text-body-md font-body-md text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors" href="#">Shipping Policy</a>
</div>
<div class="flex flex-col gap-3">
<span class="text-label-md font-label-md font-bold text-primary dark:text-inverse-primary mb-1">Legal</span>
<a class="text-body-md font-body-md text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors" href="#">Privacy</a>
<a class="text-body-md font-body-md text-on-surface-variant hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors" href="#">Terms of Service</a>
</div>
</div>
</footer>
<!-- Floating WhatsApp Button -->
<a class="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50 group" href="#">
<svg fill="currentColor" height="32" viewbox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg">
<path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-5.824 4.74-10.563 10.564-10.563 5.826 0 10.564 4.741 10.564 10.564 0 5.822-4.74 10.561-10.564 10.561z"></path>
</svg>
<span class="absolute -top-10 bg-inverse-surface text-inverse-on-surface px-3 py-1 rounded-md text-label-sm font-label-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">Chat with us</span>
</a>
</body></html>