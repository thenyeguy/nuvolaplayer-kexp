/*
 * Copyright 2018 Jiří Janoušek <janousek.jiri@gmail.com>
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

'use strict';

(function (Nuvola) {
  const PlaybackState = Nuvola.PlaybackState
  const PlayerAction = Nuvola.PlayerAction
  const player = Nuvola.$object(Nuvola.MediaPlayer)
  const WebApp = Nuvola.$WebApp()

  WebApp._onInitWebWorker = function (emitter) {
    Nuvola.WebApp._onInitWebWorker.call(this, emitter)

    const state = document.readyState
    if (state === 'interactive' || state === 'complete') {
      this._onPageReady()
    } else {
      document.addEventListener('DOMContentLoaded', this._onPageReady.bind(this))
    }
  }

  WebApp._onPageReady = function () {
    Nuvola.actions.connect('ActionActivated', this)
    this.update()
  }

  WebApp.update = function () {
    const track = {
      title: Nuvola.queryText('.Player-meta .Player-title span', (title) => title.replace('–', '').trim()),
      artist: Nuvola.queryText('.Player-meta .Player-title a'),
      album: Nuvola.queryText('.Player-meta .Player-album'),
      artLocation: Nuvola.queryAttribute('.Player-coverImage', 'src', (src) => {
        src = src.trim()
        if (!src) {
          return null
        }
        if (src.startsWith('/')) {
          src = window.location.origin + src
        }
        return src
      })
    }
    if (track.album && !track.title) {
      track.title = track.album
      track.album = null
    }
    player.setTrack(track)

    const state = this._getState()
    player.setPlaybackState(state)
    player.setCanPlay(state === PlaybackState.PAUSED)
    player.setCanPause(state === PlaybackState.PLAYING)

    // Schedule the next update
    setTimeout(this.update.bind(this), 500)
  }

  WebApp._getPlayButton = function () {
    return document.querySelector('.Player-ctaButton')
  }

  WebApp._getState = function () {
    if (document.querySelector('.Player.Player--playing') && this._getPlayButton()) {
      return PlaybackState.PLAYING
    }
    if (document.querySelector('.Player') && this._getPlayButton()) {
      return PlaybackState.PAUSED
    }
    return PlaybackState.UNKNOWN
  }

  WebApp._onActionActivated = function (emitter, name, param) {
    const playButton = this._getPlayButton()
    switch (name) {
      case PlayerAction.TOGGLE_PLAY:
      case PlayerAction.PLAY:
      case PlayerAction.PAUSE:
      case PlayerAction.STOP:
        Nuvola.clickOnElement(playButton)
        break
    }
  }

  WebApp.start()
})(this) // function(Nuvola)
