/*
 * Copyright 2015 Michael Nye <thenyeguy@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

(function(Nuvola)
{

    // Create media player component
    var player = Nuvola.$object(Nuvola.MediaPlayer);

    // Handy aliases
    var PlaybackState = Nuvola.PlaybackState;
    var PlayerAction = Nuvola.PlayerAction;

    // Create new WebApp prototype
    var WebApp = Nuvola.$WebApp();

    // Create flowplayer API object
    var kexpApi = null;

    function startApi() {
        // Sometimes the API seems to return null rather than an object on the
        // first call, so we use a timeout callback to attempt again, and only
        // start the update routine after a success.
        kexpApi = flowplayer();
        if(kexpApi == null)
        {
            setTimeout(startApi, 100);
        }
        else
        {
            // Configure callbacks
            kexpApi.onStart(function(clip) {
                player.setCanPlay(false);
                player.setCanPause(true);
            });
            kexpApi.onStop(function(clip) {
                player.setCanPlay(true);
                player.setCanPause(false);
            });

            // Start update routine
            WebApp.update();
        }
    }

    // Initialization routines
    WebApp._onInitWebWorker = function(emitter)
    {
        Nuvola.WebApp._onInitWebWorker.call(this, emitter);

        var state = document.readyState;
        if (state === "interactive" || state === "complete")
            this._onPageReady();
        else
            document.addEventListener("DOMContentLoaded",
                    this._onPageReady.bind(this));
    }

    // Page is ready for magic
    WebApp._onPageReady = function()
    {
        // Connect handler for signal ActionActivated
        Nuvola.actions.connect("ActionActivated", this);

        // Set default action states
        player.setCanPlay(false);
        player.setCanPause(false);
        player.setCanGoPrev(false);
        player.setCanGoNext(false);

        // Configure API hooks
        startApi();
    }

    // Extract data from the web page
    WebApp.update = function()
    {
        // Scrape track info
        var track = document.getElementById("track").innerText;
        var artist = document.getElementById("artistname").innerText;
        var album = document.getElementById("album").innerText;
        var art = document.getElementById('albumart').getAttribute('src');
        var track = {
            title: track,
            artist: artist,
            album: album,
            artLocation: art
        };

        // Set default state
        var state = PlaybackState.UNKNOWN;
        if(kexpApi.isPlaying())
            state = PlaybackState.PLAYING;
        else
            state = PlaybackState.PAUSED;

        player.setTrack(track);
        player.setPlaybackState(state);

        // Schedule the next update
        setTimeout(this.update.bind(this), 500);
    }

    // Handler of playback actions
    WebApp._onActionActivated = function(emitter, name, param)
    {
        switch(name)
        {
            case PlayerAction.TOGGLE_PLAY:
                if(kexpApi.isPlaying())
                    kexpApi.pause();
                else
                    kexpApi.play();
                break;
            case PlayerAction.PLAY:
                kexpApi.play();
                break;
            case PlayerAction.PAUSE:
                kexpApi.pause();
                break;
        }
    }

    WebApp.start();
})(this);
