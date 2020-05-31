# Frequently Asked Questions

## How is it privacy aware ?

We do not collect or store any information via the app. Infact, we did go one step ahead and removed the Internet permission. Indic Keyboard is one of the safest way to type even in English language.

## Where can I get the source code ?

You can get the source code or report issues in our GitLab repo. License for the code is Apache License, Version 2.0.

## From where can I download it ?

- [F-Droid](https://f-droid.org/en/packages/org.smc.inputmethod.indic/)
- [Google Play Store](https://play.google.com/store/apps/details?id=org.smc.inputmethod.indic)

## Will my phone support it ?

Indic keyboard supports Android version 4.1 and above. If you can see your language in its native script below, you should be able to install and use it.

Some devices may not support all the languages listed since the device manufacturer didn't ship necessary fonts. For older versions of Android, even when necessary fonts are there, rendering for some of the languages is not perfect. This is some thing which we can't fix from application side.

## What is a keyboard layout ?

Indic keyboard provides multiple "keyboard layouts". This means that you will have different ways to type in your native language.

Transliteration allows you to type out words using English characters, but will automatically transform the words to your native language. For example, if you type "namaste" in English while using Devanagari transliteration keyboard, it will transform it to नमस्ते correctly.

Inscript layout is the standardized keyboard that Government of India came up with to cater for the majority of the languages in India. We support the full specification, and if you are already familiar with Inscript on your Desktop, it will work on the phone too.

Phonetic Keyboard lays characters in the similiar sounding position of the Latin characters. For example, the location where 'A' in placed in QWERTY layout, a similiar sounding 'അ' can be seen in case of Malayalam. This actually helps users who likes to type seeing their native characters, locating and learning will be easier.

Compact Keyboard allows to type Indian languages without the shift key. You can long press on the letters to get more options. Goal is to try and fit all characters without a second layer of characters.

There are some other layouts as well, specific to the languages - do try them out.


## What layouts are supported ?
- Assamese Keyboard (অসমীয়া) - Inscript, Transliteration
- Arabic Keyboard (العَرَبِيةُ‎‎)
- Bengali Keyboard (বাংলা) - Probhat, Avro, Inscript, Compact
- Burmese Keyboard (ဗမာ) - xkb
- English
- Gujarati Keyboard (ગુજરાતી) - Phonetic, Inscript, Transliteration
- Hindi Keyboard (हिन्दी) - Inscript, Transliteration, Soni
- Kannada Keyboard (ಕನ್ನಡ) - Phonetic, Inscript, Transliteration (Baraha), Compact, Anysoft
- Kashmiri Keyboard (کأشُر) - Inscript, Transliteration
- Malayalam Keyboard (മലയാളം) - Phonetic, Inscript, Transliteration (Mozhi), Swanalekha
- Manipuri Keyboard / Methei Keyboard (মৈতৈলোন্) - Inscript
- Maithili Keyboard (मैथिली) - Inscript
- Marathi Keyboard (मराठी) - Transliteration
- Mon Keyboard (ဘာသာ မန်;)
- Nepali Keyboard (नेपाली) - Phonetic, Traditional, Transliteration, Inscript
- Oriya Keyboard (ଓଡ଼ିଆ) - Inscript, Transliteration, Lekhani
- Punjabi Keyboard (ਪੰਜਾਬੀ) - Phonetic, Inscript, Transliteration
- Sanskrit Keyboard (संस्कृत) - Transliteration
- Santali Keyboard (Devanagari script and Ol Chiki) (संताली / ᱥᱟᱱᱛᱟᱲᱤ) - Inscript, Ol Chiki, Ol Chiki Compact
- Sinhala Keyboard / Sinhalese (සිංහල) - Transliteration
- Tamil Keyboard (தமிழ்) - Tamil-99, Inscript, Phonetic, Compact, Transliteration
- Telugu Keyboard (తెలుగు) - Phonetic, Inscript, Transliteration, KaChaTaThaPa, Compact
- Urdu Keyboard (اردو) - Transliteration

## Does the app have Gesture Typing ?

We do have a variant of Indic Keyboard with gesture typing (swipe) enabled. You can get the app from Google Play Store. This version uses proprietary binaries from Google, we do not have access to the source code of that.


## Settings screen doesn't open in MiUI (Xiaomi devices)
This is due to a permission issue specific to MiUI. It can be fixed by giving MiUI specific permission by following steps
- Open settings
- Go to Permissions
- Navigate to other permissions
- Select Indic Keyboard from the list
- Give permission for Display pop-up windows while running in the background
