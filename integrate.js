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
        console.log("starting api")
        kexpApi = flowplayer();
        if(kexpApi == null)
        {
            console.log("api start failed");
            setTimeout(this.startApi.bind(this), 100);
        }
        else
        {
            console.log("api started");

            // Configure callbacks
            kexpApi.onStart(function(clip) {
                console.log("audio started");
                player.setCanPlay(false);
                player.setCanPause(true);
            });
            kexpApi.onStop(function(clip) {
                console.log("audio stopped");
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
        console.log("Setting action states")
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
        console.log("Updating...");
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
        console.log("Track: " + track);

        // Set default state
        var state = PlaybackState.UNKNOWN;
        if(kexpApi.isPlaying())
            state = PlaybackState.PLAYING;
        else
            state = PlaybackState.PAUSED;
        console.log("State: " + state);

        player.setTrack(track);
        player.setPlaybackState(state);

        // Schedule the next update
        console.log("Setting timeout");
        setTimeout(this.update.bind(this), 500);
    }

    // Handler of playback actions
    WebApp._onActionActivated = function(emitter, name, param)
    {
        console.log("_onActionActivated: " + name);
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
