# Elementor templates – one header, page + product

Use **one header** site-wide, and separate **Single Page** and **Single Product** templates so the hero works correctly on both.

## Files

| File | Purpose |
|------|--------|
| **01-header-global.json** | Header only: logo, search, cart, nav. Assign as **Header** in Theme Builder so it shows on the whole site. |
| **02-single-page-hero.json** | For **pages**: hero (badge, page title, excerpt, CTAs) + page content. Assign to **Single Page**. |
| **03-single-product-hero.json** | For **products**: hero (product title, price, excerpt, add to cart) + gallery & description. Assign to **Single Product**. |

## How to use in WordPress

1. **Import**
   - **Templates → Saved Templates** (or Theme Builder).
   - **Import** each JSON file.

2. **Theme Builder**
   - **Theme Builder → Headers**  
     Create or edit a header and **Import** (or replace content with) **01-header-global.json**.  
     Set **Display Conditions** to **Entire Site** (or All Pages, All Posts, etc.).  
   - **Theme Builder → Single**  
     - Add a **Single** template and choose **Page**. Import **02-single-page-hero.json** (or paste its content).  
     - Add a **Single** template and choose **Product** (WooCommerce). Import **03-single-product-hero.json**.

3. **Result**
   - Every page and product uses the **same header**.
   - **Pages** use the page hero (page title, excerpt, your CTAs).
   - **Products** use the product hero (product title, price, excerpt, add to cart), then gallery and description below.

## If something doesn’t match your site

- **Widget types**: If you don’t have WooCommerce or use different widgets, edit **03-single-product-hero.json** and change widget types (e.g. `woocommerce-product-title` → whatever your builder uses).
- **URLs / IDs**: Replace placeholder image URLs and menu IDs with your site’s (e.g. logo image, menu ID).
- **Conditions**: In Theme Builder, set each template’s **Display Conditions** so:
  - Header = entire site.
  - Single Page = only for **Page**.
  - Single Product = only for **Product** (WooCommerce).

## Original template

The original `elementor-216-2026-03-15.json` mixed the header and the page hero in one template, so it couldn’t be used as a single site-wide header and didn’t separate pages from products. These three files split that into one global header plus two single templates.
