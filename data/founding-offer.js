/* THE FOUNDING FAMILY OFFER — off until there is a real checkout behind it.

   The first families to subscribe take a chance on you before there are any
   reviews to reassure them, and they are the ones who tell their ward. This
   is the offer that thanks them: a lower yearly price, locked for as long as
   they stay.

   ⚠️ IT IS OFF, AND IT MUST STAY OFF UNTIL `link` HOLDS A REAL PAYHIP
   PRODUCT. A banner advertising $39 that sends a family to a $49 checkout is
   worse than no banner. Turning it on is two edits here — `active: true` and
   the link — and nothing else on the website needs to change.

   To switch it on:
     1. In Payhip, create a new subscription product at the founding price,
        with the 7-day trial on.
     2. Copy its link. Payhip writes them two ways and both work here:
          https://payhip.com/b/XXXXX
          https://payhip.com/order?link=XXXXX&pricing_plan=YYYYY
     3. Paste it below and set active to true.
*/
window.LST_FOUNDING = {
  active: false,                 // ⚠️ leave false until the link below is real
  link:   "",                    // the whole link, copied from Payhip
  price:  "$39",                 // the founding yearly price
  normal: "$49",                 // what it is compared against
  seats:  500,                   // how many families the offer is open to
  taken:  0,                     // update as they go, or leave at 0 to hide the count

  headline: "Founding Family",
  promise:  "locked for as long as you stay"
};
