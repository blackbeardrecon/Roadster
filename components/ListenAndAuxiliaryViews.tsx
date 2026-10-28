'use client';

import React from 'react';
import {ChevronLeft, Play, Thermometer, Compass, Wind} from 'lucide-react';
import {
  AlbumItem,
  CockpitState,
  MADE_FOR_YOU_ALBUMS,
  RECENTLY_PLAYED_ALBUMS,
  TO_THE_STARS_TRACKS,
  TrackItem,
} from '@/lib/roadster-state';

interface ListenAndAuxiliaryViewsProps {
  state: CockpitState;
  onSelectListenSubView: (sub: 'Overview' | 'AlbumDetail') => void;
  onSelectAlbum: (album: AlbumItem) => void;
  onSelectTrack: (track: TrackItem) => void;
  onChangeCabinTemp: (tempF: number) => void;
  onEnterTrackMode: () => void;
}

export default function ListenAndAuxiliaryViews({
  state,
  onSelectListenSubView,
  onSelectAlbum,
  onSelectTrack,
  onChangeCabinTemp,
  onEnterTrackMode,
}: ListenAndAuxiliaryViewsProps) {
  if (state.trackModeView !== 'Off') return null;

  // 1. LISTEN VIEW (1:1 with ui_4.jpg, sec_25.jpg & sec_26.jpg)
  if (state.primaryTab === 'Listen') {
    const heroAlbum = RECENTLY_PLAYED_ALBUMS[0];
    const recentlyPlayed = RECENTLY_PLAYED_ALBUMS.slice(1);

    if (state.listenSubView === 'AlbumDetail') {
      // Album Tracklist View (matches sec_26.jpg with 7 translucent track rows over 3D Roadster silhouette)
      return (
        <div
          className="absolute inset-0 top-8 bottom-24 px-16 pt-2 z-20 flex flex-col justify-between select-none pointer-events-auto"
          data-testid="listen-album-detail"
        >
          {/* Top Header */}
          <div className="grid grid-cols-12 items-end mb-3">
            <div className="col-span-3">
              <button
                type="button"
                onClick={() => onSelectListenSubView('Overview')}
                className="flex items-center gap-1.5 text-sm text-[#ff1a1a] hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            </div>
            <div className="col-span-6">
              <h2 className="text-2xl font-semibold text-[#ff1a1a] tracking-tight">
                {heroAlbum.title}
              </h2>
              <p className="text-xl text-[#801313]">{heroAlbum.artist}</p>
            </div>
            <div className="col-span-3 text-right text-sm text-[#a31919]">
              <span>{heroAlbum.genre}</span>
              <span className="mx-1.5">·</span>
              <span>{heroAlbum.year}</span>
            </div>
          </div>

          {/* Main 2-Column Content: Album Art + Play Button on Left, 7 Translucent Tracklist Rows on Right */}
          <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
            <div className="col-span-3 flex flex-col gap-3">
              <div className="aspect-square w-full bg-[#120303] overflow-hidden border border-[#ff1a1a]/20">
                <img
                  src={heroAlbum.coverUrl}
                  alt={heroAlbum.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => onSelectTrack(TO_THE_STARS_TRACKS[0])}
                className="h-14 w-full bg-[#240303]/85 border-t border-[#ff1a1a]/60 hover:bg-[#3b0606] flex items-center justify-center text-[#ff1a1a] transition-colors"
                aria-label="Play To The Stars Album"
              >
                <Play className="w-5 h-5 fill-[#ff1a1a]" />
              </button>
            </div>

            {/* Tracklist Rows (7 tracks including 07 Solar Meridian 4:48, translucent so 3D Roadster shows through) */}
            <div className="col-span-9 flex flex-col gap-2 overflow-y-auto pr-2">
              {TO_THE_STARS_TRACKS.map((track) => {
                const isCurrent = state.activeTrackTitle === track.title;
                return (
                  <button
                    key={track.number}
                    type="button"
                    onClick={() => onSelectTrack(track)}
                    className={`h-12 px-5 flex items-center justify-between border-t backdrop-blur-[1px] transition-all text-left shrink-0 ${
                      isCurrent
                        ? 'bg-[#2e0505]/70 border-[#ff1a1a] text-[#ff1a1a]'
                        : 'bg-[#1a0303]/60 border-[#ff1a1a]/40 text-[#d92626] hover:bg-[#290404]/75'
                    }`}
                  >
                    <div className="flex items-center gap-6 text-sm">
                      <span className="font-mono tabular-nums text-[#b91c1c]">
                        {track.number}
                      </span>
                      <span className="font-medium text-[#ff1a1a]">{track.title}</span>
                    </div>
                    <span className="text-sm font-mono tabular-nums text-[#ff1a1a]">
                      {track.duration}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Listen Overview (matches ui_4.jpg / sec_24.jpg & sec_25.jpg with Recently Played + Made For You)
    return (
      <div
        className="absolute inset-0 top-6 bottom-24 px-16 z-20 flex flex-col justify-between select-none pointer-events-none overflow-y-auto"
        data-testid="listen-overview"
      >
        {/* Top Hero Section: Left Album + Play Album Button, Right 3D Silhouette stays visible */}
        <div className="flex items-start gap-8 pointer-events-auto w-fit shrink-0">
          <div className="w-[185px] h-[185px] bg-[#120303] overflow-hidden border border-[#ff1a1a]/20 shrink-0">
            <img
              src={heroAlbum.coverUrl}
              alt={heroAlbum.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-between h-[185px] py-0.5">
            <div>
              <div className="text-xs text-[#b91c1c] mb-1.5">Last Listened</div>
              <h1 className="text-3xl font-semibold text-[#ff1a1a] tracking-tight">
                {heroAlbum.title}
              </h1>
              <p className="text-2xl text-[#7f1313] mt-0.5">{heroAlbum.artist}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                onSelectAlbum(heroAlbum);
                onSelectListenSubView('AlbumDetail');
              }}
              className="w-[260px] h-[56px] bg-[#240303]/90 border-t border-[#ff1a1a]/65 hover:bg-[#3b0606] text-sm font-medium text-[#ff1a1a] transition-colors flex items-center justify-center"
            >
              Play Album
            </button>
          </div>
        </div>

        {/* Recently Played + Made For You Strips */}
        <div className="pointer-events-auto flex flex-col gap-3 mt-3">
          <div>
            <div className="text-xs font-medium text-[#ff1a1a] mb-2">Recently Played</div>
            <div className="grid grid-cols-7 gap-4">
              {recentlyPlayed.map((album) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => onSelectAlbum(album)}
                  className="flex flex-col text-left group"
                >
                  <div className="aspect-square w-full bg-[#120303] overflow-hidden border border-white/5 group-hover:border-[#ff1a1a] transition-colors mb-1.5">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="text-xs font-medium text-[#ff1a1a] truncate w-full">
                    {album.title}
                  </div>
                  <div className="text-[11px] text-[#7f1313] truncate w-full">
                    {album.artist}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Made For You Strip (visible in sec_25.jpg / ui_4.jpg bottom) */}
          <div>
            <div className="text-xs font-medium text-[#ff1a1a] mb-1.5">Made For You</div>
            <div className="grid grid-cols-7 gap-4">
              {MADE_FOR_YOU_ALBUMS.map((album) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => onSelectAlbum(album)}
                  className="flex items-center gap-2 bg-[#140303]/85 border border-[#ff1a1a]/20 hover:border-[#ff1a1a] p-1.5 text-left group transition-colors"
                >
                  <div className="w-8 h-8 bg-[#120303] overflow-hidden shrink-0">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-[#ff1a1a] truncate">
                      {album.title}
                    </div>
                    <div className="text-[10px] text-[#7f1313] truncate">
                      {album.artist}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. CLIMATE OVERLAY VIEW (Interactive cockpit climate controls over the 3D Roadster)
  if (state.primaryTab === 'Climate') {
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center pl-24 z-20">
        <div className="pointer-events-auto w-[420px] bg-[#1a0303]/90 border border-[#ff1a1a]/35 p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#ff1a1a]">
              <Thermometer className="w-4 h-4" />
              <span className="text-sm font-semibold">Cockpit Climate Control</span>
            </div>
            <span className="text-2xl font-mono tabular-nums text-[#ff1a1a] font-bold">
              {state.cabinTempF}°F
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            {[64, 66, 68, 70, 72].map((temp) => (
              <button
                key={temp}
                type="button"
                onClick={() => onChangeCabinTemp(temp)}
                className={`flex-1 py-2 text-xs font-mono tabular-nums border transition-colors ${
                  state.cabinTempF === temp
                    ? 'bg-[#3d0606] border-[#ff1a1a] text-[#ff1a1a] font-semibold'
                    : 'bg-[#120202] border-[#ff1a1a]/20 text-[#991b1b] hover:text-[#ff1a1a]'
                }`}
              >
                {temp}°
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-[#b91c1c] pt-2 border-t border-[#ff1a1a]/20">
            <span className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-[#ff1a1a]" />
              Bioweapon Defense &amp; Cabin Airflow
            </span>
            <span className="text-[#ff1a1a] font-medium">Auto · Nominal</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. NAVIGATE OVERLAY VIEW (Interactive Circuit & Telemetry Navigation)
  if (state.primaryTab === 'Navigate') {
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center pl-24 z-20">
        <div className="pointer-events-auto w-[420px] bg-[#1a0303]/90 border border-[#ff1a1a]/35 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#ff1a1a]">
              <Compass className="w-4 h-4" />
              <span className="text-sm font-semibold">Telemetry &amp; Circuit Navigation</span>
            </div>
            <span className="text-xs font-mono text-[#ff1a1a]">GPS LOCK</span>
          </div>

          <p className="text-xs text-[#b91c1c] leading-relaxed">
            Active circuit waypoint locked at Laguna / Fremont Test Track (Elevation 90 ft).
            Switch to Track Mode for live sector splits and G-force telemetry.
          </p>

          <button
            type="button"
            onClick={onEnterTrackMode}
            className="w-full py-3 bg-[#3d0606] border border-[#ff1a1a] text-xs font-semibold text-[#ff1a1a] hover:bg-[#ff1a1a] hover:text-black transition-colors"
          >
            Launch Track Mode Telemetry
          </button>
        </div>
      </div>
    );
  }

  return null;
}
