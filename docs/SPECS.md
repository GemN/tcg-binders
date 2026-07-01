# TCG Binders

## 1. Overview

### Product Name

"MegaBinder" name not yet decided, this is a placeholder to represent the project.

### Summary

Users can create binders of their cards and share them online.
This help for organic card trading in part of the worlds where there is no marketplace, such as Thailand.
Starting with Magic The Gathering.

### Problem Statement

For Magic The Gathering, there is no marketplace for trading cards online in Thailand. 
To find cards, users:
- buy cards from professional shop (mostly in Bangkok)
- find cards in private facebook groups by scrolling sellers posts then DM seller
- find cards in private LINE groups by posting what they are looking for
- buy cards from shopee / facebook marketplace
The biggest problem is to find specific cards.

### Goals

1st version:
- Make a quick and easy app to share binders of cards online (creation or import of a list of cards)
- Each card can have an individual price, custom note, condition.
- Seller can share a binder to buyers with a link.
- Buyer can search for cards by name, color, any filter related to MTG inside a binder.
- Buyer can add cards to a basket then generate a checkout message.
- Buyer and sellers can set currency of their choice (THB, USD, EUR, GBP) and set up to two comparaison prices for each card.

2nd version:
- Marketplace from binders marked public.

3rd version:
- Extends to more TCGs (pokemon, yugioh, asian tcgs etc)

### Success Metrics

- Numbers of binders created
- Numbers of checkout messages generated
- Numbers of visits

## 2. Users and Use Cases

### Target Users

- TCG individual sellers that want more buyers
- Buyers that are looking for specific cards

### Primary Use Cases

1. Share binders of cards online
2. Compare prices of cards with market rates

## 3. Product Requirements

### Functional Requirements

| Done | ID     | Requirement                                                        | Priority | Notes                                                                                        |
|------|--------|--------------------------------------------------------------------|----------|----------------------------------------------------------------------------------------------|
| [x]  | FR-001 | Users can create a binder without being logged                     | Must     | Saving the binder require logging                                                            |
| [x]  | FR-002 | Logged user can share a binder with a small url                    | Must     | Share url must be short                                                                      |
| [x]  | FR-003 | Users can add a card to their binder by searching from a card name | Must     | -                                                                                            |
| [x]  | FR-004 | Users can import a list of cards from a CSV or Text in a binder    | Must     | This must follow the format of a manabox export                                              |
| [ ]  | FR-005 | Users can export a list of cards from a binder in CSV or Text      | Should   | This must follow the format of a manabox import                                              |
| [x]  | FR-006 | Users can select their currency of choice for display              | Must     | This will be saved in account, or local storage is not logged                                |
| [x]  | FR-007 | Users can set a price in a defined currency                        | Must     | Price can be set with helpers, like "CKD x25" (it's how thai do from USD to THB)             |
| [ ]  | FR-008 | Users can set a dynamic pricing in a defined currency              | Should   | For ex, CKD x25 will always show the price depending on the market                           |
| [x]  | FR-009 | Users can define condition, quantity, foil type, language          | Must     |                                                                                              |
| [ ]  | FR-010 | Users can search by name and others domain filters                 | Must     | By domain filters, in MTG that would be mana, power, set, rarity etc                         |
| [x]  | FR-011 | Users can set a website language                                   | Must     | Starting with english, thai. Saved in account if logged, else local storage.                 |
| [ ]  | FR-012 | Users can set up to two comparaison prices                         | Should   | Comparaison price is picked from a marketplace like CKD, TCGPlayer, Cardmarket               |
| [ ]  | FR-013 | Users can add to a basket and checkout                             | Must     | The checkout will generate a message listing all cards, sum and show total to send to seller |
| [x]  | FR-014 | Users can browse cards from pages left to right in "binder view"   | Must     | On mobile, this must be a vertical scrollable list                                           |
| [x]  | FR-015 | Users can set "lists" view                                         | Should   | List view is a table, with no images                                                         |
| [ ]  | FR-016 | Users can drag and drop to reorder cards in their binders          | Should   | Only in sorting "seller order"                                                               |
| [x]  | FR-017 | Users can sort binders                                             | Must     | By seller order (default), name, price                                                       |
| [ ]  | FR-018 | Users can open a feedback popup to send feedback                   | Could    | This should happens after specific actions, this will be posted to a discord channel         |
| [ ]  | FR-019 | Users can add set a wishlist of cards they want                    | Must     | Should have the same functionality as a binder but type wishlist                             |

### User Flows

#### Flow: Quick start

1. Users arrive on the home page, there is a search to add their first card OR a CTA to import a CSV/Texte which will to redirect a new binder with the cards.
2. Users continue to add cards to their binder.
3. Users will click on share which will prompt them to login or create an account
4. After login or account creation, the user will be redirected to their binder with a popup to share the binder.


## 4. Data Model

### Core Entities

| Entity       | Description                | Key Fields                                                                      |
|--------------|----------------------------|---------------------------------------------------------------------------------|
| Binder       | Binder that contains cards | name, tcg, is_public                                                            |
| Binder Card  | Binder card                | id, foil, rarity, quantity, price, currency, dynamic_price, condition, language |
| User Profile | general user data          | nickname                                                                        |

These entities may be incomplete.

### Constraints

Define how do we store card data / fetch it.

## 5. UX and UI Requirements

### Design Principles

- This should be close to a game collection like Magic The Gathering Arena, or Hearthstone.

### Responsive Behavior

Mobile-first design.

## 6. Analytics and Observability

### Product Events

| Event              | Trigger                                | Properties         |
|--------------------|----------------------------------------|--------------------|
| visit              | when user visits                       | google analytics   |
| checkout_generated | when user generates a checkout message | google analytics   |
| binder_created     | when user creates a binder             | google analytics   |

