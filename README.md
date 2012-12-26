
brexgen
=======

What?
-----
Dynamic browser extension generation.

Currently targets Chrome and GitHub only. Firefox support is next. Then BitBucket.

How?
----
Workflow to be finalised.
For now, clone this and hardcode the urls of your repo.
You might even want to just put this on the gh-pages branch of your main repo.

Note: Chrome auto-update will not (cannot) work out of the box unless you host
your crx somewhere. Which the point of this is to avoid. And you shouldn't put
changing binaries in git anyway.

Why?
-----
I was (am) unwilling to pay for the permission to improve Google's platform on
Chrome, so started thinking about alternative ways to distribute Chrome
extensions.
In addition, distributing alpha releases seems like it must be painful without
one's own server.

While considering options, I discovered GitHub had removed downloads
functionality. But having recently seen extensionizr, I wondered why they
couldn't be packaged dynamically on the client side.

If you want something doing, do it yourself.

Thanks and Inspirations
-----------------------
* https://github.com/altryne/extensionizr
* https://github.com/gildas-lormeau/zip.js
* https://github.com/honestbleeps/BabelExt
* https://github.com/Swader/ChromeSkel_a
* ScraperWiki (https://scraperwiki.com/) :)

Licence
-------
Copyright (c) 2012 Aidan Hobson Sayers.
Available under the MIT (Expat) Licence.
