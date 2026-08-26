/* THE LANTERN LULLABY — the signature one, the same words as the app.

   Every night carries its own lullaby, and that one arrives in the database
   with the night. This is the other one: A Little Travelers' Lullaby, which
   belongs to no single night and is always there to sing.

   The words are Levi's, copied from the app's own lullaby-lantern.html so the
   website sings exactly what the app sings. If it changes in the app, change
   it here too — this is a second copy, and second copies drift.

   Read by js/lst-read.js through lullaby.html?which=lantern, which is behind
   the subscription — see js/lst-members-only.js, and the warning in it about
   what that does and does not do.
*/
window.LST_LANTERN_LULLABY = {
  title: "A Little Travelers' Lullaby",
  subtitle: "Sing it slow. The words are for you \u2014 the calm is for them.",
  artist: "Little Scripture Travelers",
  /* where the song lives once you've uploaded it.
     url can be the song's page in the app, or the mp3 itself.
     id is optional — pass it if your player looks songs up by id. */
  /* The music. It only downloads when somebody presses play. */
  song: { url: "audio/hush-little-traveler.mp3", id: "", title: "A Little Travelers' Lullaby" },
  theme: "auto",
  backUrl: "morning-lantern-2026-07-28-come-celebrate-with-god.html",

  parts: [
    { id:"hush", label:"Hush, Little Traveler", kind:"verse", stanzas:[
      "Hush, little traveler, the day is done,\nThe moon is up, the stars have come.\nYour pillow\u2019s soft, your covers deep \u2014\nA comfy nest for little sleep.",
      "Mom and Dad are nearby too,\nWith hearts that watch the whole night through.\nAnd One who loves you even more\nIs closer than your bedroom door.",
      "Heavenly Father knows your name \u2014\nHe knew it long before you came.\nYou\u2019re loved for who you are inside,\nWith loving arms stretched open wide."
    ]},
    { id:"chorus1", label:"Goodnight, Friends", kind:"chorus", stanzas:["CHORUS"] },
    { id:"beau", label:"Beau the Brave", kind:"traveler", tone:"beau", stanzas:[
      "Beau the Brave has stories true \u2014\n<i class=\"quote\">\u201CBig heart, brave start, that\u2019s me and you!\u201D</i>\nWhen Goliath came, young David knew\nHeavenly Father would help him through.",
      "When lions roared, brave Daniel prayed,\nAnd in the den he was not afraid.\nSo when you feel a giant near,\nHeavenly Father calms your fear."
    ]},
    { id:"scout", label:"Scout the Seeker", kind:"traveler", tone:"scout", stanzas:[
      "Scout the Seeker, curious and free \u2014\n<i class=\"quote\">\u201CLook and see \u2014 what could it be?\u201D</i>\nA bush that burned with wondrous light,\nA pillar of fire that shone at night.",
      "Young Samuel listened in the night,\nAnd Heavenly Father helped him choose the right.\nWhen something\u2019s hard, when roads feel long,\nLook up, dear one \u2014 His light is strong."
    ]},
    { id:"willow", label:"Willow the Warm", kind:"traveler", tone:"willow", stanzas:[
      "Willow the Warm wraps tight and slow \u2014\n<i class=\"quote\">\u201CWarm hugs, warm hearts wherever we go.\u201D</i>\nLike Ruth who stayed by Naomi\u2019s side,\nWith faithful love to be her guide.",
      "Like Joseph, who forgave his brothers too,\nThough they had hurt him through and through.\nWhen hearts feel small and tears come down,\nHeavenly Father\u2019s love is all around."
    ]},
    { id:"wren", label:"Wren the Wonderer", kind:"traveler", tone:"wren", stanzas:[
      "Wren the Wonderer, gentle and slow \u2014\n<i class=\"quote\">\u201CPause and ponder \u2014 what a wonder we know.\u201D</i>\nLike Joseph pondering dreams in the night,\nAnd Pharaoh learning what they meant was right.",
      "Like Elijah listening, still and small,\nFor the quiet voice beyond it all.\nWhen questions come and answers hide,\nThe Holy Ghost can whisper inside."
    ]},
    { id:"chorus2", label:"Goodnight, Friends", kind:"chorus", stanzas:["CHORUS"] },
    { id:"stories", label:"Stories We Remember", kind:"verse", stanzas:[
      "Moses raised his staff up high,\nAs frightened people wondered why.\nThe waters parted, wide and deep \u2014\nHeavenly Father His children would keep.",
      "A path appeared where none had been,\nAnd Israel safely traveled in.\nWhen you can\u2019t see which way to go,\nHeavenly Father knows the road.",
      "Jonah ran across the sea,\nBut Heavenly Father heard his plea.\nInside the fish, he prayed once more,\nThen found his second chance ashore.",
      "Noah built when skies were clear,\nTrusting Heavenly Father year by year.\nWhen rain came down and waters grew,\nHe learned Heavenly Father\u2019s words were true.",
      "Abraham looked into the night\nAnd saw the stars so small and bright.\nHeavenly Father made a promise there \u2014\nAnd Abraham trusted in His care.",
      "Hannah prayed with all her heart,\nAnd Heavenly Father heard each part.\nShe trusted Him through hope and tears,\nAnd He stayed near throughout the years.",
      "Esther stood courageous and tall,\nThough she was frightened by it all.\nShe chose to speak, she chose what\u2019s right,\nAnd Heavenly Father gave her might.",
      "Job had days of grief and pain,\nWhen nothing seemed to make sense again.\nThough answers didn\u2019t all appear,\nHe learned that Heavenly Father was still near."
    ]},
    { id:"jesus", label:"Then Jesus Came", kind:"verse", stanzas:[
      "Then Jesus came to walk our way;\nHe felt our hurts, He knew each day.\nHe carried every ache and tear,\nSo when you\u2019re sad, He\u2019s always near.",
      "When we do wrong and want to mend,\nHe lifts it off \u2014 He is our Friend.\nYou\u2019re not the worst thing you have done;\nHe makes you clean, dear little one.",
      "Because of Him, death can\u2019t hold on;\nThe bands are loosed, the sting is gone.\nSo families can stay together \u2014\nWith Heavenly Father, home forever."
    ]},
    { id:"yours", label:"You Are His", kind:"verse", stanzas:[
      "You are not what the world might say \u2014\nNot just a stumble, not yesterday.\nNot what you have, not what you wear,\nBut a child of Heavenly Father\u2019s care.",
      "A spirit precious, known above,\nA little wonder wrapped in love.\nThe Holy Ghost is whispering near,\nA still, small voice your heart can hear.",
      "When you are scared, when you\u2019re alone,\nHe\u2019ll teach you truth and guide you home.\nLike Samuel listening in the night,\nYou can listen for what is right."
    ]},
    { id:"drift", label:"Drift, Little Traveler", kind:"verse", stanzas:[
      "So drift, little traveler, soft and slow,\nWith all the friends and stories you know.\nBeau\u2019s brave heart, Scout\u2019s seeking eye,\nWillow\u2019s warm hug, Wren\u2019s gentle why \u2014",
      "Four little friends who walked with you\nThrough Old Testament stories, brave and true.\nFrom David\u2019s sling to Daniel\u2019s den,\nWe\u2019ll dream about their stories again."
    ]},
    { id:"chorus3", label:"Goodnight, Friends", kind:"chorus", stanzas:["CHORUS"] },
    { id:"goodnight", label:"Sleep Tight", kind:"verse", stanzas:[
      "Mom and Dad love you deep, love you wide,\nAnd Heavenly Father stays by your side.\nJesus loves you every day,\nThe Holy Ghost can light your way.",
      "Sleep tight, sweet child, you\u2019re never alone \u2014\nYou\u2019re loved in heaven; you\u2019re loved at home."
    ]}
  ],

  chorus: "Goodnight Beau, goodnight Scout,\nGoodnight friends both in and out.\nGoodnight Willow, goodnight Wren,\nWe will travel here again.\nClose your eyes and say a prayer \u2014\nHeavenly Father\u2019s always there."
};
