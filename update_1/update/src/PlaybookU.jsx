import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* PLAYBOOK U — coaching whiteboard for every sport
   Views: Board · Crunch Time · Counter & Tips · Expert
   Subscription-gated. 1-day free trial (one per email), then Plus $9.99/mo or Unlimited $17.99/mo. */

const SIM_LIMIT = 30, TOKEN_PACK = 50;
const PLAN_CAP = { trial:30, plus:100, unlimited:Infinity };
const PLAN_NAME = { trial:"Free trial", plus:"Plus", unlimited:"Unlimited" };
const TRIAL_MS = 864e5;
const monthKey = () => { const d = new Date(); return d.getFullYear() + "-" + d.getMonth(); };

const SPORTS = {
  football:   { label:"Football",   count:11, field:"football",   vb:[600,840] },
  basketball: { label:"Basketball", count:5,  field:"basketball", vb:[600,660] },
  soccer:     { label:"Soccer",     count:11, field:"pitch", variant:"soccer", fill:"grass", vb:[560,840] },
  volleyball: { label:"Volleyball", count:6,  field:"volleyball", vb:[760,600] },
  hockey:     { label:"Hockey",     count:6,  field:"pitch", variant:"hockey", fill:"ice", vb:[560,840] },
  tennis:     { label:"Tennis",     count:2,  field:"tennis",     vb:[780,560] },
  baseball:   { label:"Baseball",   count:9,  field:"diamond",    vb:[680,680] },
  softball:   { label:"Softball",   count:9,  field:"diamond",    vb:[680,680] },
  swimming:   { label:"Swimming",   count:6,  field:"pool",       vb:[560,840] },
  boxing:     { label:"Boxing",     count:2,  field:"ring",       vb:[640,640] },
  mma:        { label:"MMA",        count:2,  field:"octagon",    vb:[680,680] },
  wrestling:  { label:"Wrestling",  count:2,  field:"mat",        vb:[640,640] },
  lacrosse:   { label:"Lacrosse",   count:10, field:"lacrosse",   vb:[560,840] },
  golf:       { label:"Golf",       count:1,  field:"golf",       vb:[440,820] },
  custom:     { label:"Custom",     count:6,  field:"custom",     vb:[680,520] },
};

const DEFAULTS = {
  football:[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["TE",.69,.58],["QB",.5,.66],["RB",.5,.75],["X",.13,.58],["Z",.87,.58],["SL",.28,.6]],
  basketball:[["PG",.5,.78],["SG",.16,.62],["SF",.84,.62],["PF",.33,.42],["C",.6,.34]],
  soccer:[["GK",.5,.93],["LB",.18,.74],["CB",.4,.77],["CB",.6,.77],["RB",.82,.74],["LM",.18,.52],["CM",.4,.54],["CM",.6,.54],["RM",.82,.52],["ST",.4,.3],["ST",.6,.3]],
  volleyball:[["OH",.24,.32],["MB",.5,.29],["OP",.76,.32],["L",.24,.62],["S",.5,.64],["DS",.76,.62]],
  hockey:[["G",.5,.93],["LD",.35,.72],["RD",.65,.72],["LW",.25,.45],["C",.5,.42],["RW",.75,.45]],
  tennis:[["NET",.35,.64],["BL",.65,.78]],
  baseball:[["P",.5,.6],["C",.5,.85],["1B",.67,.54],["2B",.59,.42],["SS",.41,.42],["3B",.33,.54],["LF",.24,.24],["CF",.5,.16],["RF",.76,.24]],
  softball:[["P",.5,.58],["C",.5,.84],["1B",.66,.53],["2B",.58,.43],["SS",.42,.43],["3B",.34,.53],["LF",.25,.26],["CF",.5,.19],["RF",.75,.26]],
  swimming:[["1",.083,.8],["2",.25,.8],["3",.417,.8],["4",.583,.8],["5",.75,.8],["6",.917,.8]],
  boxing:[["Red",.5,.68],["Blu",.5,.32]],
  wrestling:[["You",.5,.6],["Opp",.5,.4]],
  mma:[["Red",.5,.66],["Blu",.5,.34]],
  lacrosse:[["G",.5,.92],["D",.35,.78],["D",.5,.8],["D",.65,.78],["M",.22,.54],["M",.5,.5],["M",.78,.54],["A",.32,.28],["A",.68,.28],["A",.5,.2]],
  golf:[["⛳",.5,.9]],
  custom:[["P1",.3,.7],["P2",.5,.7],["P3",.7,.7],["P4",.35,.45],["P5",.5,.45],["P6",.65,.45]],
};
const DEF_DEFAULTS = {
  football:[["DE",.34,.5],["DT",.44,.5],["DT",.56,.5],["DE",.66,.5],["LB",.38,.4],["LB",.5,.38],["LB",.62,.4],["CB",.14,.42],["CB",.86,.42],["S",.4,.22],["S",.6,.22]],
  basketball:[["PG",.5,.42],["SG",.25,.54],["SF",.75,.54],["PF",.35,.34],["C",.65,.34]],
  soccer:[["GK",.5,.12],["LB",.15,.28],["CB",.38,.26],["CB",.62,.26],["RB",.85,.28],["LM",.2,.42],["CM",.4,.4],["CM",.6,.4],["RM",.8,.42],["F",.4,.6],["F",.6,.6]],
  volleyball:[["B",.3,.18],["B",.5,.16],["B",.7,.18],["D",.2,.55],["D",.5,.6],["D",.8,.55]],
  hockey:[["G",.5,.08],["LD",.35,.28],["RD",.65,.28],["LW",.25,.55],["C",.5,.58],["RW",.75,.55]],
};

const VB_FULL = [
  ["OH",.3,.6],["MB",.5,.6],["OP",.7,.6],["L",.3,.84],["S",.5,.84],["DS",.7,.84],
  ["OH",.3,.4],["MB",.5,.4],["OP",.7,.4],["L",.3,.16],["S",.5,.16],["DS",.7,.16],
];
const FORMATIONS = {
  football:{ "I-Form":[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["TE",.69,.58],["QB",.5,.65],["FB",.5,.72],["RB",.5,.8],["X",.12,.58],["Z",.88,.58]],
    "Shotgun":[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["QB",.5,.72],["RB",.62,.74],["X",.1,.58],["Z",.9,.58],["SL",.26,.6],["SL",.74,.6]],
    "Goal Line":[["LT",.38,.13],["LG",.44,.13],["C",.5,.13],["RG",.56,.13],["RT",.62,.13],["TE",.68,.13],["TE",.32,.13],["QB",.5,.19],["FB",.5,.26],["RB",.42,.32],["RB",.58,.32]],
    "Spread":[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["QB",.5,.7],["RB",.5,.78],["X",.08,.58],["H",.26,.58],["Y",.74,.58],["Z",.92,.58]],
    "Pistol":[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["TE",.69,.58],["QB",.5,.69],["RB",.5,.78],["X",.1,.58],["Z",.9,.58],["SL",.28,.6]],
    "Singleback":[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["TE",.69,.58],["QB",.5,.66],["RB",.5,.74],["X",.1,.58],["Z",.9,.58],["SL",.28,.6]],
    "Empty":[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["QB",.5,.7],["X",.08,.58],["SL",.24,.6],["TE",.7,.58],["H",.78,.6],["Z",.92,.58]],
    "Trips":[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["QB",.5,.72],["RB",.42,.74],["X",.1,.58],["SL",.72,.6],["H",.8,.62],["Z",.9,.58]],
    "Bunch":[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["QB",.5,.66],["RB",.5,.74],["X",.74,.6],["SL",.8,.56],["H",.78,.64],["Z",.12,.58]],
    "Wildcat":[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["TE",.69,.58],["RB",.5,.72],["QB",.34,.6],["FB",.6,.66],["X",.1,.58],["Z",.9,.58]],
    "Pro Set":[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["TE",.69,.58],["QB",.5,.65],["RB",.4,.74],["RB",.6,.74],["X",.1,.58],["Z",.9,.58]],
    "Twins":[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["TE",.32,.58],["QB",.5,.7],["RB",.5,.78],["X",.78,.6],["Z",.88,.58],["H",.14,.58]],
    "Jumbo":[["LT",.36,.58],["LG",.43,.58],["C",.5,.58],["RG",.57,.58],["RT",.64,.58],["TE",.3,.58],["TE",.7,.58],["QB",.5,.65],["FB",.5,.72],["RB",.5,.8],["Z",.86,.56]],
    "Flexbone":[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["QB",.5,.64],["FB",.5,.72],["RB",.34,.66],["RB",.66,.66],["X",.12,.58],["Z",.88,.58]],
    "Shotgun Pistol":[["LT",.38,.58],["LG",.44,.58],["C",.5,.58],["RG",.56,.58],["RT",.62,.58],["QB",.5,.71],["RB",.5,.8],["X",.1,.58],["SL",.26,.6],["SL",.74,.6],["Z",.9,.58]] },
  volleyball:{
    "Base 6v6":[["OH",.3,.6],["MB",.5,.6],["OP",.7,.6],["L",.3,.84],["S",.5,.84],["DS",.7,.84],["OH",.3,.4],["MB",.5,.4],["OP",.7,.4],["L",.3,.16],["S",.5,.16],["DS",.7,.16]],
    "5-1 System":[["S",.66,.6],["MB",.46,.6],["OH",.26,.6],["OP",.72,.82],["OH",.32,.82],["L",.52,.84],["OH",.3,.4],["MB",.5,.4],["OP",.7,.4],["L",.3,.16],["S",.5,.16],["DS",.7,.16]],
    "6-2 System":[["OH",.26,.58],["MB",.5,.56],["OH",.74,.58],["S",.66,.84],["S",.34,.84],["L",.5,.86],["OH",.3,.4],["MB",.5,.4],["OP",.7,.4],["L",.3,.16],["S",.5,.16],["DS",.7,.16]],
    "Serve Receive (W)":[["P",.22,.7],["P",.5,.78],["P",.78,.7],["P",.34,.6],["P",.66,.6],["S",.5,.56],["OH",.3,.4],["MB",.5,.4],["OP",.7,.4],["L",.3,.16],["S",.5,.16],["DS",.7,.16]],
    "Stack Block":[["MB",.5,.55],["OH",.34,.55],["OP",.66,.55],["S",.5,.68],["L",.38,.86],["DS",.62,.86],["OH",.3,.4],["MB",.5,.4],["OP",.7,.4],["L",.3,.16],["S",.5,.16],["DS",.7,.16]],
    "Spread Attack":[["OH",.2,.58],["MB",.5,.58],["OP",.8,.58],["L",.28,.85],["S",.5,.87],["DS",.72,.85],["OH",.3,.4],["MB",.5,.4],["OP",.7,.4],["L",.3,.16],["S",.5,.16],["DS",.7,.16]] },
  basketball:{ "Man":[["PG",.5,.78],["SG",.16,.62],["SF",.84,.62],["PF",.33,.42],["C",.6,.34]],
    "Horns":[["PG",.5,.74],["W",.16,.5],["W",.84,.5],["BIG",.36,.4],["BIG",.64,.4]],
    "1-4 Low":[["PG",.5,.66],["W",.2,.3],["W",.8,.3],["BIG",.36,.3],["BIG",.64,.3]],
    "1-4 High":[["PG",.5,.68],["SG",.2,.46],["SF",.8,.46],["PF",.38,.44],["C",.62,.44]],
    "4-Out":[["PG",.5,.72],["W",.18,.5],["W",.82,.5],["C",.28,.3],["C",.72,.3]],
    "5-Out":[["PG",.5,.72],["SG",.18,.55],["SF",.82,.55],["PF",.3,.34],["C",.7,.34]],
    "Triangle":[["PG",.64,.62],["SG",.2,.62],["SF",.3,.34],["PF",.5,.3],["C",.52,.5]],
    "Box":[["PG",.5,.66],["SG",.34,.46],["SF",.66,.46],["PF",.34,.3],["C",.66,.3]],
    "Flex":[["PG",.5,.7],["SG",.2,.5],["SF",.8,.5],["PF",.4,.3],["C",.6,.3]],
    "Pick & Roll":[["PG",.5,.64],["C",.56,.52],["SG",.16,.5],["SF",.84,.5],["PF",.3,.3]],
    "Iso":[["PG",.5,.62],["SG",.18,.46],["SF",.82,.46],["PF",.2,.3],["C",.8,.3]],
    "Stack":[["PG",.5,.68],["SG",.5,.52],["SF",.5,.42],["PF",.36,.3],["C",.64,.3]] },
  lacrosse:{ "2-3-1":[["G",.5,.92],["D",.35,.78],["D",.5,.8],["D",.65,.78],["M",.22,.52],["M",.5,.48],["M",.78,.52],["A",.32,.28],["A",.68,.28],["A",.5,.2]],
    "1-4-1":[["G",.5,.92],["D",.35,.78],["D",.5,.8],["D",.65,.78],["M",.5,.56],["A",.18,.34],["A",.82,.34],["A",.35,.24],["A",.65,.24],["M",.5,.4]],
    "Circle":[["G",.5,.92],["D",.3,.76],["D",.5,.8],["D",.7,.76],["M",.24,.5],["M",.76,.5],["A",.3,.3],["A",.7,.3],["A",.5,.22],["M",.5,.44]],
    "3-3 Open":[["G",.5,.92],["D",.3,.78],["D",.5,.8],["D",.7,.78],["M",.3,.54],["M",.5,.5],["M",.7,.54],["A",.3,.3],["A",.5,.26],["A",.7,.3]] },
  soccer:{ "4-4-2":[["GK",.5,.93],["LB",.18,.74],["CB",.4,.77],["CB",.6,.77],["RB",.82,.74],["LM",.18,.52],["CM",.4,.54],["CM",.6,.54],["RM",.82,.52],["ST",.4,.3],["ST",.6,.3]],
    "4-3-3":[["GK",.5,.93],["LB",.18,.74],["CB",.4,.77],["CB",.6,.77],["RB",.82,.74],["CM",.35,.55],["CM",.5,.58],["CM",.65,.55],["LW",.25,.3],["ST",.5,.26],["RW",.75,.3]],
    "3-5-2":[["GK",.5,.93],["CB",.3,.76],["CB",.5,.78],["CB",.7,.76],["LWB",.12,.55],["CM",.35,.55],["CM",.5,.58],["CM",.65,.55],["RWB",.88,.55],["ST",.4,.3],["ST",.6,.3]],
    "4-2-3-1":[["GK",.5,.93],["LB",.18,.74],["CB",.4,.77],["CB",.6,.77],["RB",.82,.74],["DM",.4,.6],["DM",.6,.6],["AM",.25,.42],["AM",.5,.42],["AM",.75,.42],["ST",.5,.26]] },
};
const DEF_FORMATIONS = {
  football:{ "4-3":DEF_DEFAULTS.football,
    "4-4":[["DE",.34,.5],["DT",.44,.5],["DT",.56,.5],["DE",.66,.5],["LB",.32,.4],["LB",.44,.4],["LB",.56,.4],["LB",.68,.4],["CB",.14,.42],["CB",.86,.42],["S",.5,.22]],
    "3-4":[["DE",.38,.5],["NT",.5,.5],["DE",.62,.5],["LB",.3,.42],["LB",.44,.41],["LB",.56,.41],["LB",.7,.42],["CB",.14,.42],["CB",.86,.42],["S",.4,.22],["S",.6,.22]],
    "Nickel":[["DE",.36,.5],["DT",.46,.5],["DT",.56,.5],["DE",.66,.5],["LB",.44,.4],["LB",.58,.4],["CB",.12,.42],["CB",.88,.42],["NB",.3,.4],["S",.4,.22],["S",.6,.22]],
    "Dime":[["DE",.36,.5],["DT",.46,.5],["DT",.56,.5],["DE",.66,.5],["LB",.5,.4],["CB",.12,.42],["CB",.88,.42],["NB",.3,.4],["NB",.7,.4],["S",.4,.22],["S",.6,.22]],
    "Cover 2":[["DE",.34,.5],["DT",.44,.5],["DT",.56,.5],["DE",.66,.5],["LB",.35,.4],["LB",.5,.38],["LB",.65,.4],["CB",.15,.45],["CB",.85,.45],["S",.35,.2],["S",.65,.2]],
    "Cover 3":[["DE",.34,.5],["DT",.44,.5],["DT",.56,.5],["DE",.66,.5],["LB",.38,.4],["LB",.62,.4],["CB",.16,.28],["CB",.84,.28],["S",.5,.16],["S",.4,.4],["S",.6,.4]],
    "Tampa 2":[["DE",.34,.5],["DT",.44,.5],["DT",.56,.5],["DE",.66,.5],["LB",.35,.4],["LB",.5,.32],["LB",.65,.4],["CB",.15,.44],["CB",.85,.44],["S",.35,.2],["S",.65,.2]],
    "46 Bear":[["DE",.3,.52],["DT",.42,.52],["DT",.54,.52],["DE",.66,.52],["LB",.4,.42],["LB",.55,.42],["LB",.7,.42],["CB",.15,.4],["CB",.85,.4],["S",.4,.24],["S",.6,.24]],
    "Goal Line":[["DE",.3,.52],["DT",.4,.52],["NT",.5,.52],["DT",.6,.52],["DE",.7,.52],["LB",.4,.42],["LB",.5,.42],["LB",.6,.42],["CB",.2,.44],["CB",.8,.44],["S",.5,.3]],
    "3-3-5":[["DE",.38,.5],["NT",.5,.5],["DE",.62,.5],["LB",.35,.4],["LB",.5,.4],["LB",.65,.4],["CB",.14,.42],["CB",.86,.42],["S",.34,.22],["S",.5,.2],["S",.66,.22]],
    "5-2":[["DE",.3,.5],["DT",.42,.5],["NT",.5,.5],["DT",.58,.5],["DE",.7,.5],["LB",.4,.4],["LB",.6,.4],["CB",.15,.42],["CB",.85,.42],["S",.4,.22],["S",.6,.22]],
    "Cover 1":[["DE",.34,.5],["DT",.44,.5],["DT",.56,.5],["DE",.66,.5],["LB",.38,.4],["LB",.62,.4],["CB",.15,.4],["CB",.85,.4],["NB",.7,.38],["S",.4,.4],["S",.5,.16]],
    "Prevent":[["DE",.4,.5],["DT",.5,.5],["DE",.6,.5],["LB",.35,.42],["LB",.65,.42],["CB",.18,.3],["CB",.82,.3],["S",.3,.16],["S",.5,.14],["S",.7,.16],["NB",.5,.36]] },
  basketball:{ "Man":DEF_DEFAULTS.basketball,
    "2-3 Zone":[["G",.35,.5],["G",.65,.5],["F",.2,.3],["C",.5,.24],["F",.8,.3]],
    "3-2 Zone":[["G",.3,.45],["G",.5,.42],["G",.7,.45],["F",.35,.26],["F",.65,.26]],
    "1-3-1 Zone":[["G",.5,.58],["G",.25,.42],["F",.5,.42],["G",.75,.42],["C",.5,.28]],
    "1-2-2 Zone":[["G",.5,.56],["G",.32,.44],["F",.68,.44],["F",.3,.28],["C",.7,.28]],
    "Box-and-1":[["G",.5,.5],["G",.35,.42],["F",.65,.42],["C",.5,.3],["X",.5,.62]],
    "Diamond Press":[["G",.5,.78],["G",.3,.62],["F",.7,.62],["F",.5,.48],["C",.5,.3]],
    "Switch Man":[["PG",.5,.5],["SG",.28,.5],["SF",.72,.5],["PF",.38,.34],["C",.62,.34]],
    "Full Press":[["G",.2,.8],["G",.5,.78],["G",.8,.8],["F",.35,.55],["F",.65,.55]] },
  lacrosse:{ "Man D":[["G",.5,.08],["D",.35,.22],["D",.5,.2],["D",.65,.22],["M",.3,.46],["M",.5,.5],["M",.7,.46],["A",.35,.7],["A",.65,.7],["A",.5,.76]],
    "Zone D":[["G",.5,.08],["D",.4,.24],["D",.5,.18],["D",.6,.24],["M",.3,.4],["M",.5,.46],["M",.7,.4],["A",.35,.66],["A",.65,.66],["A",.5,.72]],
    "Ride":[["G",.5,.08],["D",.35,.3],["D",.5,.28],["D",.65,.3],["M",.3,.52],["M",.5,.56],["M",.7,.52],["A",.3,.76],["A",.5,.82],["A",.7,.76]] },
  soccer:{ "Low Block":DEF_DEFAULTS.soccer,
    "Mid Block":[["GK",.5,.12],["LB",.18,.34],["CB",.4,.32],["CB",.6,.32],["RB",.82,.34],["LM",.25,.5],["CM",.5,.5],["RM",.75,.5],["F",.35,.66],["F",.5,.66],["F",.65,.66]],
    "High Press":[["GK",.5,.18],["LB",.2,.45],["CB",.4,.45],["CB",.6,.45],["RB",.8,.45],["LM",.3,.62],["CM",.5,.62],["RM",.7,.62],["F",.35,.78],["F",.5,.8],["F",.65,.78]] },
  volleyball:{ "Perimeter":DEF_DEFAULTS.volleyball,
    "Rotation D":[["B",.35,.2],["B",.5,.18],["B",.65,.2],["D",.25,.5],["D",.5,.58],["D",.75,.5]],
    "Read Block":[["B",.3,.16],["B",.5,.15],["B",.7,.16],["D",.22,.5],["D",.5,.5],["D",.78,.5]] },
};

const FB_BLITZ = {
  "Double A-Gap":[["DE",.34,.5],["DT",.44,.5],["DT",.56,.5],["DE",.66,.5],["LB",.47,.42,[[.49,.62]]],["LB",.53,.42,[[.51,.62]]],["CB",.14,.42],["CB",.86,.42],["NB",.3,.4],["S",.4,.22],["S",.6,.22]],
  "Cover 0 Blitz":[["DE",.34,.5,[[.4,.64]]],["DT",.44,.5,[[.46,.64]]],["DT",.56,.5,[[.54,.64]]],["DE",.66,.5,[[.6,.64]]],["LB",.4,.42,[[.45,.62]]],["LB",.6,.42,[[.55,.62]]],["CB",.14,.4],["CB",.86,.4],["NB",.28,.4],["LB",.72,.42],["S",.5,.3]],
  "Fire Zone":[["DE",.34,.5,[[.4,.63]]],["DT",.44,.5,[[.46,.63]]],["DT",.56,.5],["DE",.66,.5,[[.6,.63]]],["LB",.4,.42,[[.46,.6]]],["LB",.62,.42,[[.66,.34]]],["CB",.14,.4],["CB",.86,.4],["NB",.5,.34],["S",.3,.2],["S",.7,.2]],
  "Corner Blitz":[["DE",.34,.5,[[.4,.63]]],["DT",.44,.5,[[.46,.63]]],["DT",.56,.5,[[.54,.63]]],["DE",.66,.5,[[.6,.63]]],["CB",.12,.46,[[.32,.6]]],["LB",.42,.42],["LB",.5,.4],["LB",.6,.42],["CB",.86,.42],["S",.4,.22],["S",.6,.22]],
  "Safety Blitz":[["DE",.34,.5,[[.4,.63]]],["DT",.44,.5,[[.46,.63]]],["DT",.56,.5,[[.54,.63]]],["DE",.66,.5,[[.6,.63]]],["LB",.4,.42],["LB",.6,.42],["CB",.14,.4],["CB",.86,.4],["S",.42,.28,[[.47,.58]]],["S",.65,.2],["NB",.3,.4]],
};
const FB_BLITZ_INFO = {
  "Double A-Gap":"Both inside linebackers show pressure in the A-gaps on either side of the center, forcing the offense to account for them.",
  "Cover 0 Blitz":"All-out man pressure — six rushers, no deep safety help. High risk, high reward.",
  "Fire Zone":"A 5-man zone pressure: rush five, drop a lineman, and play three-deep three-under behind it.",
  "Corner Blitz":"A cornerback rushes off the edge while the coverage rotates to cover his man.",
  "Safety Blitz":"A safety comes downhill as an extra rusher, attacking gaps the line doesn't expect.",
};

const TIPS = {
  football:["Vs Cover 2: attack the deep middle with seam and post routes, and hit the soft spot behind the corners with smash concepts.","Vs man coverage: use rub/pick concepts (mesh, slants) and motion to create natural mismatches.","Vs heavy blitz: go to quick game — slants, hitches, screens — and keep a back in to protect.","Vs a 4-3 base front: attack the edges with outside zone and stretch the linebackers horizontally.","On defense vs spread: play nickel, keep two high safeties, and force everything underneath."],
  basketball:["Vs a 2-3 zone: flash a player to the free-throw line, overload one side, and shoot from the short corner.","Vs man: run pick-and-roll and back-cuts when defenders overplay the passing lanes.","Vs a full-court press: get the ball to the middle, use a trailer, and attack 4-on-3.","On defense vs a hot shooter: switch screens and contest high without fouling.","Late shot clock: clear out for your best iso scorer or run a quick ball-screen."],
  soccer:["Vs a low block: switch the play quickly, overload the wings, and shoot from the top of the box.","Vs a high press: play direct to a target forward or beat the first line with a quick give-and-go.","Vs man-marking: use rotations and third-man runs to break the markers.","On defense vs fast wingers: stay compact, double the flank, and delay rather than dive in.","Counter-attack: win it and play forward within 3 seconds before they reset their shape."],
  volleyball:["Vs a big blocker: use a quick set to pull the block, then attack from the back row.","Vs a strong serve: switch to a 3-passer serve-receive and free up your best passer.","Vs a 6-2: target the setter on defense and serve short to disrupt their tempo.","On defense: read the hitter's approach and commit the block to their hot zone.","Tight game: run a slide or a quick to keep their block guessing."],
  baseball:["Vs an infield shift: bunt or slap the ball the other way to beat it.","Runner on 2nd with no outs: hit behind the runner to move them to third.","Vs a fastball pitcher: get on top early in the count and sit on one zone.","On defense with speed on base: pitch out or quicken your time to the plate.","Late and close: bring the corners in to cut the go-ahead run off at the plate."],
  softball:["Vs the shift: slap or bunt to the open side of the infield.","Small ball: use the slap-and-run to put pressure on the defense.","Vs a riseball pitcher: stay back and lay off the high pitch out of the zone.","On defense: play the bunt aggressively with speed at the plate.","Late innings: move runners with the short game and force throws."],
  hockey:["Vs a 1-3-1 trap: use a quick regroup and chip-and-chase to beat the neutral zone.","On the power play: set the umbrella, move the puck low-to-high, and screen the goalie.","Penalty kill: pressure in a diamond and always clear to the safe side.","Vs a heavy forecheck: use the strong-side breakout with a center swing for support."],
  tennis:["Vs a big server: block the return deep down the middle to take time away.","Vs a baseliner: bring them to the net with short slices, then pass or lob.","Doubles vs a strong net team: lob over the poacher and serve down the T.","On defense when pushed wide: hit high and deep crosscourt to reset the point."],
  swimming:["Negative split: go out controlled and finish faster than you started.","Relays: place your fastest leg as anchor unless you need an early lead.","Sprints: explode off the blocks and cut breaths in the final stretch."],
  boxing:["Vs a taller fighter: get inside, work the body, and cut off the ring.","Vs a brawler: use footwork and the jab to control distance.","Late rounds when ahead: stay mobile, score clean, and avoid trading."],
  wrestling:["From neutral: set up your shot with a tie-up and level change before attacking the legs.","On bottom: stand up or hip-heist to your feet, or hit a switch to reverse.","On top: break him down to the mat and work a turn — half nelson or a tilt.","Leading late: keep good position, ride the clock, and don't risk a scramble."],
  mma:["Vs a striker: close the distance and look for the takedown.","Vs a grappler: keep it standing, sprawl, and frame to get back up.","Late and ahead: control position and manage the clock."],
  custom:["Spread the field to create space.","Overload one side to build a numbers advantage.","On defense, stay compact and force the error."],
};

const PLAYBOOK_U = {
  football:[
    {name:"I-Formation", info:"A power-running base with the fullback and tailback stacked behind the QB. Built for downhill runs and play-action.", pos:FORMATIONS.football["I-Form"]},
    {name:"Shotgun Spread", info:"QB takes the snap deep with receivers spread wide — the backbone of modern passing offense, stretching a defense sideline to sideline.", pos:FORMATIONS.football["Spread"]},
    {name:"Goal-Line", info:"A heavy, compact set with extra blockers, used in short yardage near the end zone to push the ball across.", pos:FORMATIONS.football["Goal Line"]},
    {name:"Cover 2 Defense", info:"Two deep safeties each guard half the field while corners jam and sink. Strong against deep balls, soft up the seam.", pos:DEF_FORMATIONS.football["Cover 2"]},
    {name:"Nickel Defense", info:"Swaps a linebacker for a fifth defensive back to better defend the pass against spread looks.", pos:DEF_FORMATIONS.football["Nickel"]},
    {name:"Cover 3 Defense", info:"Three deep defenders each take a third of the field with four underneath — a sound, balanced shell against most offenses.", pos:DEF_FORMATIONS.football["Cover 3"]},
    {name:"Fire Zone Blitz", info:"A five-man zone pressure: rush five, drop a lineman into coverage, and play three-deep, three-under behind it.", pos:[["DE",.34,.5],["DT",.44,.5],["DT",.56,.5],["DE",.66,.5],["LB",.4,.42],["LB",.62,.42],["CB",.14,.4],["CB",.86,.4],["NB",.5,.34],["S",.3,.2],["S",.7,.2]]},
  ],
  basketball:[
    {name:"Triangle Offense", info:"A sideline triangle of three players creates spacing and read-based passing; famously run by the Bulls and Lakers under Phil Jackson and Tex Winter.", pos:[["PG",.5,.74],["W",.16,.5],["C",.3,.32],["F",.62,.36],["W",.84,.5]]},
    {name:"Pick & Roll", info:"A ball-handler uses a teammate's screen, then the screener rolls to the rim — the most common action in the modern game.", pos:[["PG",.5,.7],["BIG",.44,.5],["W",.16,.4],["W",.84,.4],["C",.5,.26]]},
    {name:"Motion Offense", info:"Continuous cutting and screening with no fixed spots, reading the defense to create open looks.", pos:FORMATIONS.basketball["4-Out"]},
    {name:"Horns Set", info:"Two bigs at the elbows with shooters in the corners — spaces the floor and opens ball-screen and high-low options.", pos:[["PG",.5,.72],["BIG",.38,.46],["BIG",.62,.46],["W",.12,.52],["W",.88,.52]]},
    {name:"Flex Offense", info:"A patterned continuity built on cross-screens and down-screens that keeps defenders in constant action.", pos:[["G",.32,.66],["G",.68,.66],["W",.12,.42],["W",.88,.42],["C",.5,.3]]},
    {name:"2-3 Zone", info:"Two defenders up top and three across the baseline. Protects the paint and the glass, concedes outside shots.", pos:DEF_FORMATIONS.basketball["2-3 Zone"]},
    {name:"Full-Court Press", info:"Pressure the length of the floor to force turnovers and speed up tempo.", pos:DEF_FORMATIONS.basketball["Full Press"]},
  ],
  soccer:[
    {name:"4-4-2", info:"Two banks of four with two strikers — a balanced, easy-to-organize classic.", pos:FORMATIONS.soccer["4-4-2"]},
    {name:"4-3-3", info:"Back four, midfield three, front three — width from wingers and strong central possession.", pos:FORMATIONS.soccer["4-3-3"]},
    {name:"Tiki-Taka", info:"A possession philosophy of short passing and constant movement, associated with Barcelona and Spain (built on a 4-3-3).", pos:FORMATIONS.soccer["4-3-3"]},
    {name:"Catenaccio (Low Block)", info:"The Italian defensive system: a deep, compact back line that absorbs pressure and counterattacks.", pos:DEF_FORMATIONS.soccer["Low Block"]},
    {name:"Gegenpress (High Press)", info:"Defend from the front and win the ball back high, immediately after losing it.", pos:DEF_FORMATIONS.soccer["High Press"]},
    {name:"Total Football", info:"Players fluidly interchange positions — whoever vacates a space is instantly covered by a teammate. Associated with Ajax and the Netherlands.", pos:FORMATIONS.soccer["4-3-3"]},
    {name:"Counter-Attack", info:"Sit compact, win the ball, and break forward fast before the opponent recovers their shape.", pos:DEF_FORMATIONS.soccer["Low Block"]},
  ],
  volleyball:[
    {name:"5-1 System", info:"One setter runs the offense in all six rotations for consistency and a single decision-maker.", pos:FORMATIONS.volleyball["5-1 System"]},
    {name:"6-2 System", info:"Two setters set from the back row so there are always three front-row attackers.", pos:FORMATIONS.volleyball["6-2 System"]},
    {name:"Serve Receive (W)", info:"Five passers form a W to cover the court for a clean first contact.", pos:FORMATIONS.volleyball["Serve Receive (W)"]},
    {name:"Stack Block", info:"Bunch the front-row blockers to wall off the opponent's best attacker.", pos:FORMATIONS.volleyball["Stack Block"]},
  ],
  baseball:[
    {name:"Double-Play Depth", info:"Middle infielders cheat toward second base to turn two with a runner on first.", pos:[["P",.5,.6],["C",.5,.85],["1B",.66,.52],["2B",.57,.4],["SS",.43,.4],["3B",.34,.52],["LF",.24,.24],["CF",.5,.16],["RF",.76,.24]]},
    {name:"Infield Shift", info:"Fielders move toward where a hitter tends to hit, loading one side of the infield.", pos:[["P",.5,.6],["C",.5,.85],["1B",.7,.52],["2B",.6,.46],["SS",.55,.44],["3B",.46,.46],["LF",.3,.26],["CF",.56,.18],["RF",.78,.26]]},
    {name:"No-Doubles Defense", info:"Outfielders play deep and corners guard the lines late in close games to prevent extra-base hits.", pos:[["P",.5,.6],["C",.5,.85],["1B",.72,.5],["2B",.58,.42],["SS",.42,.42],["3B",.28,.5],["LF",.2,.18],["CF",.5,.12],["RF",.8,.18]]},
  ],
  softball:[
    {name:"Double-Play Depth", info:"Middle infielders shorten up to turn two with a runner aboard.", pos:DEFAULTS.softball},
    {name:"Slap Defense", info:"The defense shifts and corners crash to handle left-handed slap hitters and bunts.", pos:[["P",.5,.58],["C",.5,.84],["1B",.62,.5],["2B",.56,.44],["SS",.4,.42],["3B",.3,.5],["LF",.26,.26],["CF",.5,.19],["RF",.74,.26]]},
  ],
  hockey:[
    {name:"Neutral-Zone Trap (1-3-1)", info:"Clog the neutral zone with a 1-3-1 wall to force turnovers and dump-ins.", pos:[["F",.5,.42],["F",.25,.55],["C",.5,.55],["F",.75,.55],["D",.5,.72]]},
    {name:"Umbrella Power Play", info:"Three players form an umbrella up high to move the puck for one-timers with a net-front screen.", pos:[["D",.5,.7],["F",.22,.5],["F",.78,.5],["F",.5,.36],["F",.5,.18]]},
    {name:"Box Penalty Kill", info:"Four killers in a tight box protect the slot and clear to safe ice.", pos:[["F",.38,.4],["F",.62,.4],["D",.38,.58],["D",.62,.58]]},
  ],
  tennis:[
    {name:"Serve & Volley", info:"Serve, then rush the net to finish with a volley — takes time away from the returner.", pos:[["SRV",.5,.52],["VOL",.5,.78]]},
    {name:"Baseline Game", info:"Play from the baseline, building points with heavy groundstrokes and patience.", pos:[["A",.42,.8],["B",.58,.86]]},
    {name:"Doubles I-Formation", info:"Server and net player line up centrally to disguise coverage and confuse returners.", pos:[["NET",.5,.56],["SRV",.5,.82]]},
  ],
  swimming:[
    {name:"Negative Split", info:"Swim the second half faster than the first — a proven pacing approach for distance events.", pos:DEFAULTS.swimming},
    {name:"Relay Order", info:"A common approach: a strong lead-off leg for an early edge, with your fastest swimmer anchoring.", pos:DEFAULTS.swimming},
  ],
  boxing:[
    {name:"Cut Off the Ring", info:"Step to angles rather than chasing straight, shrinking the space your opponent can escape to.", pos:DEFAULTS.boxing},
    {name:"Counter-Puncher", info:"Stay defensive, slip punches, and answer immediately off the miss.", pos:DEFAULTS.boxing},
  ],
  mma:[
    {name:"Sprawl & Brawl", info:"Strike on the feet and defend takedowns with sprawls to keep the fight standing.", pos:DEFAULTS.mma},
    {name:"Ground & Pound", info:"Secure top position, then control and strike from inside the guard or mount.", pos:DEFAULTS.mma},
  ],
  custom:[
    {name:"Spacing Concept", info:"Spread players to stretch the defense and open passing or running lanes.", pos:DEFAULTS.custom},
    {name:"Overload Concept", info:"Outnumber the defense on one side to create an easy advantage.", pos:[["P1",.2,.6],["P2",.32,.5],["P3",.44,.6],["P4",.5,.4],["P5",.7,.5],["P6",.8,.6]]},
  ],
};

const PITCHES = [
  {k:"4-Seam Fastball", mlb:[92,100], hx:0,      vy:-0.012, move:"straight with late ride up", pitch:"Your heater — challenge hitters up in the zone and change their eye level.", bat:"Be on time and stay short to the ball; don't get beat at the top of the zone."},
  {k:"2-Seam Fastball", mlb:[89,95],  hx:0.035,  vy:0.015,  move:"runs arm-side", pitch:"Run it back over the corner or in on the hands for weak contact.", bat:"Look for the late run and keep your hands inside the ball."},
  {k:"Cut Fastball",    mlb:[86,94],  hx:-0.03,  vy:0.006,  move:"short, late glove-side cut", pitch:"Jam the opposite-handed hitter — aim for the end of the bat.", bat:"Expect the late cut; don't commit the barrel early."},
  {k:"Sinker",          mlb:[89,95],  hx:0.04,   vy:0.03,   move:"arm-side run with sink", pitch:"Keep it down to get ground balls and double plays.", bat:"Stay on top of it and drive it back up the middle."},
  {k:"Curveball",       mlb:[74,83],  hx:-0.03,  vy:0.075,  move:"big top-to-bottom break", pitch:"Bury it for a chase, or drop it in for a called strike.", bat:"Spot the hump out of the hand and stay back over your legs."},
  {k:"Slider",          mlb:[82,89],  hx:-0.055, vy:0.03,   move:"sharp, late glove-side break", pitch:"Start it at the hip and break it off the plate.", bat:"Track the dot and lay off the one diving out of the zone."},
  {k:"Changeup",        mlb:[80,87],  hx:0.03,   vy:0.045,  move:"fades arm-side and dies", pitch:"Sell fastball arm speed and kill their timing.", bat:"Keep your weight back; don't lunge out front."},
  {k:"Forkball",        mlb:[80,87],  hx:0,      vy:0.08,   move:"tumbles late at the plate", pitch:"Tunnel it off the fastball and let it fall out of the zone.", bat:"Stay back — it drops late, so don't chase it low."},
  {k:"Knuckleball",     mlb:[62,78],  hx:0,      vy:0.02, wob:true, move:"erratic, unpredictable flutter", pitch:"Take the spin off and let it dance — even you won't know where it goes.", bat:"See it deep, react late, and just try to put it in play."},
];
function pSpeed(p, sport){ const lo=p.mlb[0], hi=p.mlb[1]; return sport==="softball"?[Math.round(lo*0.68),Math.round(hi*0.68)]:[lo,hi]; }
function ballPos(mound, plate, p, pp){ const e=pp*pp; const wob = p.wob?Math.sin(pp*22)*0.014*pp:0;
  return { x:clamp(mound.x+(plate.x-mound.x)*pp+(p.hx||0)*e+wob), y:clamp(mound.y+(plate.y-mound.y)*pp+(p.vy||0)*e) };
}
function pitchOutcome(p){
  const breaking=/Curve|Slider|Fork|Change|Knuckle/.test(p.k);
  const list = breaking
    ? ["Swing and a miss — strike!","Batter freezes — called strike.","Weak ground ball to the infield.","Batter lays off — ball.","Foul tip, stays alive.","Batter chases it in the dirt — strike."]
    : ["Swing and a miss — strike!","Fouled straight back — just missed it.","Hard line drive — base hit!","Lazy fly ball to the outfield.","Ground ball, routine play.","Called strike on the corner.","Crushed — that ball is gone!"];
  return list[Math.floor(Math.random()*list.length)];
}
const PITCH_LOCS = ["Inside","Away","Up","Down","Middle"];
const BATTERS = [
  {k:"Dead Pull",         pull:.88, power:.68, contact:.5,  depth:.6,             desc:"Turns on everything and yanks it to the pull side — bring the shift."},
  {k:"Pull Power",        pull:.74, power:.9,  contact:.45, depth:.82,            desc:"Big power to the pull side, lots of balls in the air."},
  {k:"Up the Middle",     pull:.5,  power:.45, contact:.8,  depth:.55, spread:.32,desc:"Hits it right back through the box — line drives up the middle."},
  {k:"Opposite Field",    pull:.16, power:.5,  contact:.74, depth:.62,            desc:"Lets it travel and drives the ball the other way."},
  {k:"Spray / All Fields",pull:.5,  power:.42, contact:.82, depth:.55, spread:.95,desc:"Uses the whole field — tough to position against."},
  {k:"Down the Line",     pull:.82, power:.62, contact:.55, depth:.62, spread:.28, line:true, desc:"Pulls it hard down the line, right into the corner."},
  {k:"Slap & Run",        pull:.4,  power:.16, contact:.86, depth:.32,            desc:"Slaps it on the ground and runs — play the infield in."},
];
function fieldName(x){ return x<.4?"left field":x>.6?"right field":"center field"; }
function dirWord(hand,x){ const pull = hand==="R"? x<.43 : x>.57; const oppo = hand==="R"? x>.57 : x<.43; return pull?"Pulled":oppo?"Goes the other way —":"Back up the middle —"; }
function battedBall(batter, hand, p, loc){
  const R=Math.random(), breaking=/Curve|Slider|Fork|Change|Knuckle/.test(p.k);
  let q = .3 + batter.power*0.45 + (R-0.5)*0.45;
  if(loc==="Middle") q+=0.22; if(loc==="Up") q += breaking?-0.12:0.05; if(loc==="Down") q -= breaking?0.04:0.1;
  q=Math.max(0,Math.min(1,q));
  const pullDir = hand==="R"?-1:1;            // R pulls toward left (x<.5), L toward right (x>.5)
  let aim=(batter.pull-0.5)*2; if(loc==="Inside")aim+=0.5; if(loc==="Away")aim-=0.6; aim=Math.max(-1.1,Math.min(1.1,aim));
  const mag = batter.line?0.34:0.2, spread = batter.spread!=null?batter.spread:0.5;
  const x=clamp(.5 + pullDir*aim*mag + (Math.random()-0.5)*(0.05+spread*0.24));
  const deep=(batter.depth-0.55)*0.1;
  let y,type;
  if(q>.64){ type=Math.random()<.5?"fly ball":"line drive"; y=clamp(.14 - deep + Math.random()*.16); }
  else if(q>.4){ type="ground ball"; y=clamp(.42 + Math.random()*.12); }
  else { type=Math.random()<.5?"pop-up":"weak grounder"; y= type==="pop-up"?clamp(.38+Math.random()*.1):clamp(.5+Math.random()*.08); }
  return {x:clamp(x),y:clamp(y),type,q};
}
function shiftFor(sport, hand, batter){
  const base={}; (DEFAULTS[sport]||[]).forEach(a=>{ if(!base[a[0]]) base[a[0]]={x:a[1],y:a[2]}; });
  const pullDir = hand==="R"?-1:1, aim=(batter.pull-0.5)*2;
  const inf=["3B","SS","2B","1B"], ofd=["LF","CF","RF"], out={};
  const infL=pullDir*aim*(batter.line?0.2:0.16), ofL=pullDir*aim*(batter.line?0.16:0.12);
  for(const lab in base){ let {x,y}=base[lab];
    if(inf.indexOf(lab)>=0){ x=clamp(x+infL); }
    else if(ofd.indexOf(lab)>=0){ x=clamp(x+ofL); y=clamp(y-(batter.power-0.45)*0.14); if(batter.depth<0.45) y=clamp(y+0.07); }
    out[lab]={x,y}; }
  return out;
}
const HITTERS_PM = [
  {name:"Tovar", hand:"R", loves:"inside", hates:"outside", chase:.25, power:.3, eye:.8, spd:.92, tip:"Fast leadoff — turns on the inside pitch, weak away. Live on the outside corner."},
  {name:"Reyes", hand:"L", loves:"up", hates:"down", chase:.35, power:.4, eye:.6, spd:.7, tip:"Loves the ball up. Keep it down and away."},
  {name:"Cabrera", hand:"R", loves:"middle", hates:"up", chase:.3, power:.95, eye:.7, spd:.25, tip:"Big slugger — crushes anything middle. Don't miss over the plate; climb the ladder."},
  {name:"Ortiz", hand:"L", loves:"inside", hates:"outside", chase:.4, power:.9, eye:.55, spd:.2, tip:"Power pull hitter. Stay on the outside corner, off the plate."},
  {name:"Soto", hand:"L", loves:"down", hates:"up", chase:.2, power:.7, eye:.9, spd:.4, tip:"Very disciplined, golfs the low ball. Bust him up and in."},
  {name:"Kim", hand:"R", loves:"outside", hates:"inside", chase:.45, power:.4, eye:.5, spd:.6, tip:"Reaches for outside pitches. Pound him inside; he'll chase away."},
  {name:"Diaz", hand:"R", loves:"middle", hates:"down", chase:.6, power:.5, eye:.3, spd:.55, tip:"Free swinger — chases everything, weak down. Throw breaking stuff low."},
  {name:"Park", hand:"L", loves:"up", hates:"inside", chase:.4, power:.3, eye:.5, spd:.8, tip:"Speedy slap hitter. Saw him off inside — and watch him on the bases."},
  {name:"Webb", hand:"R", loves:"middle", hates:"outside", chase:.5, power:.2, eye:.3, spd:.5, tip:"Bottom of the order — chases, little power. Attack the zone, expand away."},
];
const BASE_PTS=[[60,110],[106,64],[60,18],[14,64],[60,110]];
const FIELD_XY={ P:[60,76], C:[60,120], "1B":[96,60], "2B":[78,46], SS:[42,46], "3B":[24,60], LF:[30,22], CF:[60,12], RF:[90,22] };
function planField(ev){
  const IF={ SS:[44,48], "2B":[76,48], "3B":[26,60], "1B":[96,60], P:[60,76] };
  const OF={ LF:[32,22], CF:[60,12], RF:[90,22] };
  const r=Math.random();
  if(ev==="hr"){ const spots=[[30,4],[60,2],[90,4]]; return { ballTo:spots[Math.floor(r*3)], fielderKey:null, throwTo:null, hr:true }; }
  if(ev==="out"){
    if(r<0.6){ const ks=Object.keys(IF); const k=ks[Math.floor(Math.random()*ks.length)]; return { ballTo:IF[k], fielderKey:k, throwTo:[106,64] }; }
    const ks=Object.keys(OF); const k=ks[Math.floor(Math.random()*ks.length)]; return { ballTo:OF[k], fielderKey:k, throwTo:null, fly:true };
  }
  const ks=Object.keys(OF); const k=ks[Math.floor(Math.random()*ks.length)];
  const throwTo = ev==="3b"?[14,64] : [60,18];
  return { ballTo:OF[k], fielderKey:k, throwTo };
}
function basePos(frac){ const seg=Math.max(0,Math.min(3,Math.floor(frac))), u=frac-seg; const a=BASE_PTS[seg], b=BASE_PTS[seg+1]; return [a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u]; }
function bbMoves(ev, old, batter){ // old=[r1,r2,r3] (null|runner). returns {bases, runs, moves, label}
  const r1=old[0], r2=old[1], r3=old[2]; const moves=[]; let bases=[null,null,null], runs=0; let label="";
  const mv=(runner,from,to)=>{ if(runner) moves.push({runner,from,to,score:to>=4}); };
  if(ev==="1b"){ label="SINGLE"; mv(r3,3,4); mv(r2,2,3); mv(r1,1,2); moves.push({runner:batter,from:0,to:1});
    runs=(r3?1:0); bases=[batter,r1,r2]; }
  else if(ev==="2b"){ label="DOUBLE"; mv(r3,3,4); mv(r2,2,4); mv(r1,1,3); moves.push({runner:batter,from:0,to:2});
    runs=(r3?1:0)+(r2?1:0); bases=[null,batter,r1]; }
  else if(ev==="3b"){ label="TRIPLE"; mv(r3,3,4); mv(r2,2,4); mv(r1,1,4); moves.push({runner:batter,from:0,to:3});
    runs=(r3?1:0)+(r2?1:0)+(r1?1:0); bases=[null,null,batter]; }
  else if(ev==="hr"){ label="HOME RUN!"; mv(r3,3,4); mv(r2,2,4); mv(r1,1,4); moves.push({runner:batter,from:0,to:4});
    runs=1+(r1?1:0)+(r2?1:0)+(r3?1:0); bases=[null,null,null]; }
  else if(ev==="bb"){ label="WALK"; let a1=r1,a2=r2,a3=r3;
    if(a1){ if(a2){ if(a3){ runs++; mv(a3,3,4); } mv(a2,2,3); a3=a2; } mv(a1,1,2); a2=a1; }
    moves.push({runner:batter,from:0,to:1}); a1=batter; bases=[a1,a2,a3];
    if(r2&&!r1) mv(r2,2,2); if(r3&&!(r1&&r2)) mv(r3,3,3); }
  return {bases, runs, moves, label};
}
const FB_PLAYS=[{k:"Inside run",f:"I-Form",gen:"RUN"},{k:"Power run",f:"Jumbo",gen:"POWER"},{k:"QB run",f:"Shotgun Pistol",gen:"QBRUN"},{k:"Play-action",f:"Pistol",gen:"PA"},{k:"Quick pass",f:"Shotgun",gen:"QUICK"},{k:"Bubble screen",f:"Shotgun Pistol",gen:"BUBBLE"},{k:"Swing pass",f:"Shotgun",gen:"SWING"},{k:"Screen",f:"Shotgun",gen:"SCREEN"},{k:"Deep shot",f:"Spread",gen:"DEEP"},{k:"Four verticals",f:"Empty",gen:"DEEP"},{k:"Field goal",f:null},{k:"Punt",f:null},{k:"Kneel",f:"I-Form"},{k:"Spike",f:"Shotgun"}];
const BB_PLAYS=[{k:"Pick & Roll",f:"Pick & Roll",gen:"PNR"},{k:"Pick & Pop",f:"Pick & Roll",gen:"PNP"},{k:"Off-ball screen",f:"Box",gen:"DOWN"},{k:"Iso",f:"Iso",gen:"ISO"},{k:"Horns",f:"Horns",gen:"HORNS"},{k:"Floppy",f:"5-Out",gen:"FLOPPY"},{k:"Quick 3",f:"5-Out",gen:"THREE"},{k:"Post-up",f:"Box",gen:"POST"},{k:"Drive & kick",f:"4-Out",gen:"THREE"},{k:"Spread iso",f:"5-Out",gen:"ISO"}];
const BB_SCREENS=[
  {k:"High pick & roll",gen:"PNR",d:"Ball screen at the top — the guard attacks downhill and the big rolls to the rim."},
  {k:"Side pick & roll",gen:"SIDEPNR",d:"Wing ball screen — the guard attacks the baseline and the big rolls into the lane."},
  {k:"Step-up screen",gen:"STEPUP",d:"Screener steps up from the baseline and turns the guard back to the middle."},
  {k:"Drag screen",gen:"DRAG",d:"Early transition ball screen — the trailing big screens before the defense is set."},
  {k:"Horns set",gen:"HORNS",d:"Two bigs at the elbows — one screens and rolls, the other pops."},
  {k:"Pick & pop",gen:"PNP",d:"The big sets the screen, then pops back behind the arc for the open jumper."},
  {k:"Spain pick & roll",gen:"SPAIN",d:"Ball screen plus a back-screen on the roller's man — lob to the roller or kick to the popped shooter."},
  {k:"Down screen",gen:"DOWN",d:"The big screens down to free the shooter coming up to the wing."},
  {k:"Pin-down",gen:"PINDOWN",d:"Pin the defender; the shooter curls tight off the screen to the elbow."},
  {k:"Flare screen",gen:"FLARE",d:"Back-pick and the shooter flares to the weak side for a skip-pass three."},
  {k:"Double screen",gen:"DOUBLE",d:"Two stacked screeners — the shooter rubs both defenders off to the corner."},
  {k:"Back screen",gen:"BACK",d:"A blindside back screen frees the cutter for a backdoor layup."},
  {k:"Cross screen",gen:"CROSS",d:"A guard crosses the lane to screen for the big sealing on the block."},
];
function bbClockStr(s){ return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; }
function bbStratRead(s){ const {clock,shot,qtr,diff,to,foulThem}=s, lastShot=clock<=shot+2;
  if(qtr>=4 && clock<=24 && diff<0 && diff>=-3) return `Down ${-diff}, ${clock}s left — get a clean three to tie/lead, or take a quick two and foul if you have a timeout (${to} left).`;
  if(qtr>=4 && clock<=60 && diff>0) return `Up ${diff} late — milk the shot clock, attack the rim for an and-1 or free throws, and value every possession.`;
  if(lastShot) return `Last shot of the period — start the action with about 7 seconds left so they get no answer.`;
  if(shot<=7) return `Shot clock under ${shot} — quick ball screen or clear out for your best creator and get a shot up.`;
  if(foulThem>=5) return `They're in the bonus — attack the paint and draw contact. Every drive is free-throw money.`;
  if(diff<0) return `Trailing by ${-diff} — push tempo, hunt mismatches in the pick-and-roll, get to the rim or the line.`;
  return `Run your offense: space the floor, move the ball, and attack the first advantage — take the open three or the layup.`;
}
function fbYardLabel(y){ return y===50?"midfield":y<50?`your own ${y}`:`the opponent ${100-y}`; }
function fbClockStr(s){ return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; }
function fbStratRead(s){
  const {yard,down,dist,qtr,clock,to,diff}=s, goal=yard+dist>=100, redzone=yard>=80, fg=100-yard+17, twoMin=(qtr===2||qtr===4)&&clock<=120;
  if(down===4){
    if(dist<=1 && (diff<0||yard>=50)) return `4th & ${dist} — short yardage. QB sneak or power behind your best blocker; only punt here if you're protecting a late lead.`;
    if(redzone) return `4th down in the red zone — take the points with a ${fg}-yd field goal, unless you trail by more than 3 in the 4th.`;
    if(yard>=62) return `4th & ${dist} at ${fbYardLabel(yard)} — too close to punt, a bit far to kick (${fg} yd). Go for it if dist is short, otherwise pin them with a coffin-corner punt.`;
    return `4th & ${dist} from ${fbYardLabel(yard)} — punt it and flip the field unless you're desperate late.`;
  }
  if(goal) return `Goal-to-go at ${fbYardLabel(yard)} — condense it: power run or a quick fade/slant to your best matchup. Decide fast.`;
  if(redzone) return `Red zone (${fbYardLabel(yard)}) — field shrinks: play-action, quick slants, or a downhill run. Take what they give and protect the ball.`;
  if(twoMin && diff<0) return `Two-minute drill, down ${-diff}. Work the sideline to stop the clock, spend your ${to} timeout${to===1?"":"s"} wisely, and push tempo.`;
  if(twoMin && diff>0) return `Up ${diff} inside two minutes — run it, stay inbounds, and make them spend timeouts. No turnovers.`;
  if(twoMin && diff===0) return `Tie game, two minutes left — stay aggressive but smart; get into field-goal range and don't give it back.`;
  if(down===3) return dist>=8 ? `3rd & long (${dist}) from ${fbYardLabel(yard)} — drop back for the sticks; a draw or screen beats heavy pressure. Have the punt team loose.` : dist<=2 ? `3rd & short — stay on schedule: power run or play-action off it.` : `3rd & ${dist} — high-percentage throw to move the chains; attack their weakest coverage.`;
  if(down===2) return dist>=8 ? `2nd & long — take a chunk shot or screen to stay out of 3rd & long.` : `2nd & ${dist} — manageable; a balanced call keeps you ahead of the chains.`;
  return `1st & ${dist===10?10:dist} at ${fbYardLabel(yard)} — stay balanced; a run or play-action sets up the down & distance you want.`;
}
function baseTip(bases, outs, side){
  const on1=bases[0], on2=bases[1], on3=bases[2]; if(!(on1||on2||on3)) return "";
  const fast1=on1&&on1.spd>=.7;
  if(side==="defense"){
    if(on3 && outs<2) return `Runner on 3rd with ${outs} out — decide now: bring the infield in to cut the run at the plate, or play back and trade the out for the run. Watch for the squeeze.`;
    if(on1&&on2) return `Runners on 1st & 2nd — a ground ball is your friend with the double play in order. Keep it down.`;
    if(fast1) return `Speed on 1st — steal threat. Hold him on, use a slide-step, mix your looks, and a pitchout on 1-0 or 2-1 can nail him.`;
    if(on2) return `Runner on 2nd is in scoring position and can steal your signs — change them and check him before each pitch.`;
    if(on1) return `Runner on 1st — hold him close and stay in the zone to keep the double play alive.`;
  } else {
    if(on3 && outs<2) return `Runner on 3rd, ${outs} out — get him in: contact approach, elevate for a sac fly or roll one to the right side. A safety squeeze is on the table.`;
    if(fast1) return `Speed on 1st — make it count: straight steal on a breaking/offspeed count, or a hit-and-run to stay out of the double play and move him to 3rd.`;
    if(on1&&on2) return `1st & 2nd — a sac bunt moves both into scoring position, or hit behind the runners to advance them.`;
    if(on2) return `Runner on 2nd — shoot the ball the other way to push him to 3rd with under two outs.`;
    if(on1) return `Runner on 1st — stay out of the double play; hit behind him or put on a hit-and-run.`;
  }
  return "";
}
function pmTags(zcol,zrow){ const t=[]; if(zcol===0)t.push("inside"); if(zcol===2)t.push("outside"); if(zrow===0)t.push("up"); if(zrow===2)t.push("down"); if(zcol===1&&zrow===1)t.push("middle"); return t; }
function pmZoneWord(zcol,zrow){ const v=zrow===0?"up ":zrow===2?"down ":""; const hh=zcol===0?"in":zcol===2?"away":"over the middle"; return v+hh; }
function pmEdgeWord(edge){ return edge==="in"?"off the inside corner":edge==="out"?"off the outside corner":edge==="high"?"up out of the zone":"down out of the zone"; }
function pitchVsHitter(h, pitch, ci){
  const R=Math.random(), breaking=/Curve|Slider|Fork|Change|Knuckle/.test(pitch.k);
  if(!ci.inZone){
    const chases = R < (h.chase*(breaking?1.2:0.85)) * (1-h.eye*0.3);
    if(!chases) return {ev:"ball", txt:`${h.name} lays off the ${pitch.k.toLowerCase()} ${pmEdgeWord(ci.edge)} — ball.`};
    const r2=Math.random();
    if(r2<0.62) return {ev:"swK", txt:`${h.name} chases the ${pitch.k.toLowerCase()} ${pmEdgeWord(ci.edge)} — swing and a miss!`};
    if(r2<0.82) return {ev:"foul", txt:`${h.name} fouls one off out of the zone.`};
    return {ev:"out", txt:`${h.name} reaches and rolls over it — weak ${Math.random()<.5?"grounder":"pop-up"}, out.`};
  }
  const tags=pmTags(ci.zcol,ci.zrow), love=tags.indexOf(h.loves)>=0, hate=tags.indexOf(h.hates)>=0, zw=pmZoneWord(ci.zcol,ci.zrow);
  if(Math.random() < 0.06+h.eye*0.06) return {ev:"looK", txt:`${h.name} takes it ${zw} — called strike.`};
  if(hate){ const r2=Math.random();
    if(r2<0.5+(breaking?0.12:0)) return {ev:"swK", txt:`${h.name} swings through your ${pitch.k.toLowerCase()} ${zw} — that's his cold spot. Strike!`};
    if(r2<0.78) return {ev:"out", txt:`${h.name} gets jammed ${zw} — weak contact, out.`};
    return {ev:"foul", txt:`${h.name} fights it off foul.`};
  }
  if(love){ const r2=Math.random();
    if(r2<0.16+h.power*0.28) return {ev:"hr", txt:`${h.name} sits on that pitch ${zw} — CRUSHED. Home run!`};
    if(r2<0.48){ if(h.spd>=.7&&Math.random()<0.22) return {ev:"3b", txt:`${h.name} drives it and motors — triple into the corner!`}; return {ev:"2b", txt:`${h.name} drives it ${zw} — into the gap for a double!`}; }
    if(r2<0.8) return {ev:"1b", txt:`${h.name} handles it ${zw} — base hit.`};
    return {ev:"out", txt:`${h.name} squares it up but right at someone — out.`};
  }
  const r2=Math.random();
  if(r2<0.2) return {ev:"swK", txt:`${h.name} swings and misses ${zw} — strike.`};
  if(r2<0.4) return {ev:"foul", txt:`${h.name} fouls it straight back.`};
  if(r2<0.64) return {ev:"out", txt:`${h.name} puts it in play ${zw} — out.`};
  if(r2<0.86) return {ev:"1b", txt:`${h.name} lines it ${zw} for a base hit.`};
  if(h.spd>=.7&&Math.random()<0.18) return {ev:"3b", txt:`${h.name} laces one and beats the throw — triple!`};
  return {ev:"2b", txt:`${h.name} splits the gap — double.`};
}
function pmAvg(h, zcol, zrow){
  const tags=pmTags(zcol,zrow);
  let base = tags.indexOf(h.loves)>=0 ? .360 : tags.indexOf(h.hates)>=0 ? .200 : .270;
  if(zcol===1&&zrow===1) base+=.03;
  if(zcol!==1 && zrow!==1) base-=.03;
  base += (((zcol*3+zrow)*37)%11)/1000 - .005;
  return Math.max(.12, Math.min(.45, base));
}
function pmHeatColor(avg){
  const t=Math.max(0,Math.min(1,(avg-.18)/.22)); let r,g,b;
  if(t<.5){ const u=t/.5; r=Math.round(54+(233-54)*u); g=Math.round(120+(196-120)*u); b=Math.round(224+(80-224)*u); }
  else { const u=(t-.5)/.5; r=233; g=Math.round(196+(76-196)*u); b=Math.round(80+(60-80)*u); }
  return `rgba(${r},${g},${b},.5)`;
}
const PITCHERS_PM = [
  {name:"Cole", hand:"R", role:"SP", stamina:95, stuff:.8, note:"Ace — overpowering fastball, goes deep into games."},
  {name:"García", hand:"L", role:"SP", stamina:88, stuff:.7, note:"Crafty lefty with lots of movement."},
  {name:"Ramírez", hand:"R", role:"RP", stamina:34, stuff:.85, note:"Power setup man, mid-90s heat."},
  {name:"Boyd", hand:"L", role:"RP", stamina:28, stuff:.75, note:"Lefty specialist — brutal on left-handed bats."},
  {name:"Tanaka", hand:"R", role:"RP", stamina:38, stuff:.7, note:"Long reliever, mixes five pitches."},
  {name:"Díaz", hand:"R", role:"CL", stamina:24, stuff:.92, note:"Closer — electric, save the 9th for him."},
];
function pmApplyMods(res, mod){
  if(!mod) return res; let {ev,txt}=res; const {fatigue=0, platoon=0, stuff=.5}=mod;
  if(fatigue>0 && (ev==="out"||ev==="foul"||ev==="looK"||ev==="swK") && Math.random()<fatigue*0.32){ ev="1b"; txt="The tiring arm leaves one up — base hit."; }
  if(platoon>0 && (ev==="1b"||ev==="2b") && Math.random()<0.26){ ev="out"; txt="The platoon edge pays off — weak contact, out."; }
  if(platoon<0 && (ev==="out"||ev==="foul") && Math.random()<0.20){ ev="1b"; txt="Favorable matchup for the hitter — base hit."; }
  if(stuff>.6 && ev==="foul" && Math.random()<(stuff-.6)){ ev="swK"; txt="Filthy stuff — swing and a miss."; }
  return {ev, txt};
}
const BAT_LINEUP = [
  {name:"Rivera", pos:"CF", hand:"L", power:.3, contact:.85, speed:.92, eye:.7},
  {name:"Chen", pos:"2B", hand:"R", power:.35, contact:.85, speed:.6, eye:.78},
  {name:"Brooks", pos:"RF", hand:"L", power:.7, contact:.72, speed:.5, eye:.7},
  {name:"Santos", pos:"1B", hand:"R", power:.95, contact:.6, speed:.2, eye:.6},
  {name:"Walker", pos:"DH", hand:"R", power:.85, contact:.62, speed:.3, eye:.55},
  {name:"Nakamura", pos:"3B", hand:"L", power:.6, contact:.72, speed:.5, eye:.6},
  {name:"Okafor", pos:"C", hand:"R", power:.5, contact:.6, speed:.3, eye:.5},
  {name:"Pérez", pos:"SS", hand:"R", power:.4, contact:.72, speed:.72, eye:.55},
  {name:"Lindqvist", pos:"LF", hand:"L", power:.45, contact:.66, speed:.6, eye:.5},
];
const BAT_BENCH = [
  {name:"Bell", pos:"PH", hand:"R", power:.9, contact:.45, speed:.2, eye:.45, note:"Power bench bat — go-ahead homer threat."},
  {name:"Quick", pos:"PR", hand:"L", power:.15, contact:.6, speed:.97, eye:.6, note:"Pinch runner / slap hitter — steals bases."},
  {name:"Cole", pos:"PH", hand:"L", power:.3, contact:.9, speed:.5, eye:.82, note:"Tough out — puts the ball in play."},
  {name:"Vega", pos:"PH", hand:"S", power:.55, contact:.7, speed:.55, eye:.65, note:"Switch hitter — no platoon disadvantage."},
  {name:"Hughes", pos:"C", hand:"R", power:.45, contact:.55, speed:.2, eye:.5, note:"Backup catcher — always on the bench."},
];
const APPROACHES = [["aggressive","Swing away"],["sitFB","Sit fastball"],["sitOff","Sit offspeed"],["patient","Be patient"],["protect","Protect (2K)"],["hunt","Hunt the heart"]];
function isBreaking(k){ return /Curve|Slider|Fork|Change|Knuckle/.test(k); }
function batterVsPitch(b, P, pitch, ci, approach){
  const breaking=isBreaking(pitch.k), veloHard=Math.max(0,Math.min(1,(P.velo-78)/22));
  const platoon = (P.hand===b.hand && b.hand!=="S") ? -1 : 1;
  const inHeart = ci.inZone && ci.zcol===1 && ci.zrow===1;
  if(ci.inZone){
    let sp = approach==="patient"?0.4 : approach==="aggressive"?0.92 : approach==="protect"?0.85 : 0.72;
    if(approach==="hunt") sp = inHeart?0.95:0.25;
    if(Math.random()>=sp) return {ev:"looK", txt:`${b.name} takes it ${pmZoneWord(ci.zcol,ci.zrow)} — called strike.`};
  } else {
    let chase=(1-b.eye)*0.5; if(approach==="aggressive")chase+=0.22; if(approach==="patient")chase*=0.3; if(approach==="hunt")chase*=0.25; if(breaking)chase*=1.2;
    if(Math.random()>=chase) return {ev:"ball", txt:`${b.name} lays off ${pmEdgeWord(ci.edge)} — ball.`};
  }
  let contact=b.contact - veloHard*0.28*(1-b.contact), power=b.power;
  if(approach==="sitFB"){ breaking? contact-=0.3 : (contact+=0.2, power+=0.12); }
  if(approach==="sitOff"){ breaking? (contact+=0.2, power+=0.1) : contact-=0.2; }
  if(approach==="protect"){ contact+=0.25; power*=0.4; }
  if(approach==="aggressive"){ contact-=0.1; power+=0.15; }
  if(approach==="hunt" && inHeart){ contact+=0.22; power+=0.18; }
  contact += platoon*0.08; if(!ci.inZone) contact-=0.12;
  contact=Math.max(0.05,Math.min(0.97,contact));
  if(Math.random()>contact) return {ev:"swK", txt:`${b.name} swings through ${breaking?"the "+pitch.k.toLowerCase():P.velo+"-mph heat"} — strike.`};
  const foulP = approach==="protect"?0.32:0.2;
  if(Math.random()<foulP) return {ev:"foul", txt:`${b.name} fights it off foul.`};
  const dmg=(inHeart?0.25:ci.inZone?0.12:0)+power*0.25+(approach==="aggressive"?0.05:0), q=Math.random();
  if(q < 0.46-dmg*0.5) return {ev:"out", txt:`${b.name} ${q<0.2?"flies out":"grounds out"}.`};
  if(q < 0.78-dmg*0.5) return {ev:"1b", txt:`${b.name} lines a base hit!`};
  const hr=power*0.5+(inHeart?0.2:0)+((approach==="sitFB"&&!breaking)?0.1:0);
  if(Math.random()<hr*0.55) return {ev:"hr", txt:`${b.name} CRUSHES it — home run!`};
  if(b.speed>=.7&&Math.random()<0.3) return {ev:"3b", txt:`${b.name} rips it and flies around the bases — triple!`};
  return {ev:"2b", txt:`${b.name} splits the gap — double!`};
}
function coachRead(b, P){
  const fb=P.pitches.filter(k=>!isBreaking(k)), off=P.pitches.filter(k=>isBreaking(k));
  if(P.velo>=93) return `${P.name} is bringing ${P.velo}. Get your foot down early — sit the heater and adjust to spin, don't get beat up top.`;
  if(off.length && b.eye<.5) return `He'll try to expand the zone with the ${off[0].toLowerCase()}. ${b.name} chases — make him throw a strike, be patient early.`;
  if(b.contact>=.78) return `${b.name} controls the zone. Work the count, foul off the tough ones, and hunt a pitch you can drive.`;
  if(b.power>=.8) return `Sell out for damage — sit dead-red in the heart and swing away. One mistake and it's gone.`;
  if(P.velo<=80) return `Soft tosser at ${P.velo}. Don't get out front — stay back, let it travel, and drive it the other way.`;
  return `Balanced look. Sit fastball early, flip to protect with two strikes, and put the ball in play.`;
}
const makeFrom = (arr) => arr.map((p,i)=>({ id:`p${i}-${Math.random().toString(36).slice(2,7)}`, label:p[0], x:p[1], y:p[2], route:[] }));
const makeR = (arr) => arr.map((p,i)=>({ id:`r${i}-${Math.random().toString(36).slice(2,7)}`, label:p[0], x:p[1], y:p[2], route:(p[3]||[]).map(c=>({x:c[0],y:c[1]})) }));
const baseSet = (s,side)=> s==="volleyball" ? makeFrom(VB_FULL) : (side==="defense" ? makeFrom(DEF_DEFAULTS[s]||DEFAULTS[s]) : makeFrom(DEFAULTS[s]));
function buildIndex(sport){
  const idx=[];
  Object.entries(FORMATIONS[sport]||{}).forEach(([n,pos])=>idx.push({name:n,side:"offense",build:()=>makeFrom(pos)}));
  Object.entries(DEF_FORMATIONS[sport]||{}).forEach(([n,pos])=>idx.push({name:n,side:"defense",build:()=>makeFrom(pos)}));
  if(sport==="football") Object.entries(FB_BLITZ).forEach(([n,arr])=>idx.push({name:n,side:"defense",tag:"blitz",info:FB_BLITZ_INFO[n],build:()=>makeR(arr)}));
  (PLAYBOOK_U[sport]||[]).forEach(e=>{ const def=/defen|cover|zone|press|block|blitz|trap|kill|nickel|prevent|tampa|perimeter/i.test(e.name+" "+(e.info||"")); idx.push({name:e.name,side:def?"defense":"offense",info:e.info,build:()=>makeFrom(e.pos)}); });
  return idx;
}
function searchLibrary(sport,q){
  const ql=(q||"").toLowerCase(); const words=ql.split(/[^a-z0-9]+/).filter(w=>w.length>1);
  if(!words.length) return null;
  const idx=buildIndex(sport); let best=null,bs=0;
  idx.forEach(e=>{ const name=e.name.toLowerCase(); const hay=name+" "+((e.info||"").toLowerCase())+" "+(e.tag||"");
    let s=0; words.forEach(w=>{ if(name.includes(w))s+=3; else if(hay.includes(w))s+=1; });
    if(/blitz/.test(ql)&&e.tag==="blitz")s+=4;
    if(/defen|coverage|stop/.test(ql)&&e.side==="defense")s+=1;
    if(/offen|attack|score/.test(ql)&&e.side==="offense")s+=1;
    if(s>bs){bs=s;best=e;} });
  return bs>0?best:null;
}
const clamp = v => Math.max(0.02, Math.min(0.98, Number(v)));
const clone = (ps) => ps.map(p=>({...p, route:p.route?p.route.map(r=>({...r})):[]}));
const makeCustom = (n) => { const cols=Math.min(5,n), rows=Math.ceil(n/cols), out=[];
  for(let i=0;i<n;i++){ const r=Math.floor(i/cols), c=i%cols;
    out.push({ id:`c${i}-${Math.random().toString(36).slice(2,7)}`, label:"P"+(i+1), x:(c+1)/(cols+1), y: rows===1?.55 : .35 + r*(.4/(rows-1)), route:[] }); } return out; };

function posAt(p,t){ const pts=[{x:p.x,y:p.y},...(p.route||[])]; if(pts.length<2) return {x:p.x,y:p.y};
  const d=p.delay||0; const c01=(v)=>v<0?0:v>1?1:v; let tp = d>0?c01((t-d)/(1-d)):t;
  const ez=p.ease||"both"; if(ez==="both") tp = tp<0.5?2*tp*tp:1-Math.pow(-2*tp+2,2)/2; else if(ez==="out") tp = 1-Math.pow(1-tp,2); else if(ez==="in") tp = tp*tp;
  const seg=[]; let total=0; for(let i=1;i<pts.length;i++){ const dd=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y); seg.push(dd); total+=dd; }
  if(total===0) return {x:p.x,y:p.y}; let target=tp*total, acc=0;
  for(let i=0;i<seg.length;i++){ if(acc+seg[i]>=target){ const f=seg[i]?(target-acc)/seg[i]:0; return {x:pts[i].x+(pts[i+1].x-pts[i].x)*f, y:pts[i].y+(pts[i+1].y-pts[i].y)*f}; } acc+=seg[i]; }
  return pts[pts.length-1]; }
// Real football route tree — multi-cut routes (y smaller = downfield toward goal at top)
function routeTree(kind, x, y){ const L = x<.5?-1:1; const c=(v)=>clamp(v,0.03,0.97); const P=(ax,ay)=>({x:c(ax),y:c(ay)});
  switch(kind){
    case "go":       return [P(x+0.02*L,y-0.12), P(x+0.03*L,y-0.54)];
    case "post":     return [P(x,y-0.24), P(x-0.17*L,y-0.52)];
    case "corner":   return [P(x,y-0.24), P(x+0.15*L,y-0.48)];
    case "out":      return [P(x,y-0.20), P(x+0.15*L,y-0.225)];
    case "in":       return [P(x,y-0.20), P(x-0.17*L,y-0.235)];
    case "slant":    return [P(x-0.03*L,y-0.05), P(x-0.16*L,y-0.18)];
    case "comeback": return [P(x+0.01*L,y-0.30), P(x+0.05*L,y-0.235)];
    case "drag":     return [P(x,y-0.06), P(0.5,y-0.115)];
    case "wheel":    return [P(x+0.13*L,y-0.03), P(x+0.17*L,y-0.32)];
    case "flat":     return [P(x+0.17*L,y-0.04)];
    case "screen":   return [P(x,y-0.02), P(x+0.04*L,y-0.10)];
    case "block":    return [P(x+(Math.random()-.5)*0.05, y-0.05)];
    default:         return [P(x,y-0.3)];
  }
}

function localPlay(sport,side){
  const base = sport==="custom" ? makeCustom(SPORTS.custom.count) : baseSet(sport,side);
  const stayRe=/^(C|LT|LG|RG|RT|GK|G|P)$/i;
  const players = base.map((p)=>{
    if(stayRe.test(p.label) || Math.random()<0.22) return {...p, route:[]};
    const steps=1+Math.floor(Math.random()*2); let cx=p.x, cy=p.y; const wp=[];
    for(let i=0;i<steps;i++){ cx=clamp(cx+(Math.random()-0.5)*0.4); cy=clamp(cy-(0.12+Math.random()*0.26)); wp.push({x:cx,y:cy}); }
    return {...p, route:wp};
  });
  const names=["Vertical Stretch","Misdirection Special","Overload Flood","Quick Strike","Motion Mismatch","Spread & Attack","Counter Burst","Tempo Trap"];
  return { name:names[Math.floor(Math.random()*names.length)], players,
    description:`A ${side} concept that spreads the field and creates movement to open space, with routes pushing toward the attacking end. Drag or redraw any player to make it your own.` };
}
function localDefense(team){
  const players=(team||[]).map((p,i)=>({ id:`d${i}-${Math.random().toString(36).slice(2,7)}`, label:"D"+(i+1),
    x:clamp(p.x+(Math.random()-0.5)*0.06), y:clamp(Math.max(0.14,p.y-0.12)),
    route: p.route&&p.route.length ? [{x:clamp(p.x),y:clamp(p.y)}] : [] }));
  return { name:"Match & Contain", players,
    description:"Defenders shade goal-side of each attacker and squeeze the available space, ready to jump the routes." };
}
function localCrunch(sport,time,sc){
  const lp=localPlay(sport,"offense");
  const tl=(time||"").toLowerCase(), s=(sc||"").toLowerCase();
  const trailing=/down|behind|trail/.test(s), leading=/up|lead|ahead|winning/.test(s);
  const hurry=/2:00|2 min|1:|0:|:0|final|last|under|ot|overtime|second/.test(tl);
  let advice;
  if(trailing) advice="You're chasing points — push the tempo, attack the sidelines and edges to save the clock, and take your highest-upside look while keeping a clear next play ready.";
  else if(leading) advice="You're protecting a lead — milk the clock, keep the ball in bounds, choose low-risk touches, and make the opponent burn their stoppages.";
  else advice="Dead-even game — take a balanced, high-percentage look that keeps your options open and avoids a costly turnover.";
  const clock = hurry ? " Clock is critical: get aligned fast and have the call set before the whistle." : "";
  return { name:lp.name, players:lp.players, description:`Situation — ${time||"late game"} · ${sc||"close game"}. ${advice}${clock}` };
}
function localCounter(sport,q){
  const lp=localPlay(sport,"offense");
  const tips=TIPS[sport]||TIPS.custom; const ql=q.toLowerCase();
  const words=ql.split(/[^a-z0-9]+/).filter(w=>w.length>2);
  const hit=tips.find(t=>{ const m=t.toLowerCase(); return words.some(w=>m.includes(w)); });
  const advice = hit || `Beat "${q}" by attacking the space it gives up: move the ball quickly, build an overload where they're outnumbered, and stress every part of the field so they can't sit in one spot.`;
  return { name:("Counter: "+q).slice(0,38), players:lp.players, description:advice };
}
function localExpert(sport,side){
  const lp=localPlay(sport,side);
  const pro=["Pro Concept","Elite Look","Championship Set","Top-Shelf Scheme","Signature Series"];
  return { name:pro[Math.floor(Math.random()*pro.length)]+" — "+lp.name, players:lp.players,
    description:"A professional-caliber "+side+" concept built on spacing, timing, and a counter if the first option is taken away. "+lp.description };
}

const LIB_KEY="playbook:library", SIM_KEY="playbook:sims", ACCT_KEY="playbook:account", TRIAL_KEY="playbook:trial", BOOKS_KEY="playbook:books", ACCESS_KEY="playbook:access", GP_KEY="playbook:gameplans", LINEUP_KEY="playbook:lineups", SUGG_KEY="playbook:suggestions";
const canPersist = typeof window!=="undefined" && !!window.storage;
async function pSet(k,v){ try{ await window.storage.set(k,JSON.stringify(v)); return true; }catch{ return false; } }
async function pGet(k){ try{ const r=await window.storage.get(k); return r&&r.value?JSON.parse(r.value):null; }catch{ return null; } }

/* ---------------- Field ---------------- */
const Field = React.memo(function Field({ sport, customName }) {
  const cfg=SPORTS[sport]; const [w,h]=cfg.vb;
  const line="rgba(255,255,255,.55)", faint="rgba(255,255,255,.22)";
  const fillId={grass:"grass",ice:"ice",turf:"turf",indoor:"indoor",pool:"pool"}[cfg.fill]||"grass";
  if (cfg.field==="football"){ const els=[]; for(let i=1;i<14;i++){ const y=(h/14)*i;
      els.push(<line key={i} x1="0" y1={y} x2={w} y2={y} stroke={i===7?line:faint} strokeWidth={i===7?3:1.5}/>);
      els.push(<line key={"a"+i} x1={w*.36} y1={y-4} x2={w*.36} y2={y+4} stroke={faint} strokeWidth="1.5"/>);
      els.push(<line key={"b"+i} x1={w*.64} y1={y-4} x2={w*.64} y2={y+4} stroke={faint} strokeWidth="1.5"/>);}
    const ez=h*0.085;
    return <g><rect width={w} height={h} fill="url(#grass)"/>{els}
      <rect x="0" y="0" width={w} height={ez} fill="rgba(54,224,138,.20)"/>
      <rect x="0" y={h-ez} width={w} height={ez} fill="rgba(255,90,90,.18)"/>
      <line x1="0" y1={ez} x2={w} y2={ez} stroke={line} strokeWidth="3"/><line x1="0" y1={h-ez} x2={w} y2={h-ez} stroke={line} strokeWidth="3"/>
      <text x={w*.5} y={ez*.62} fill="rgba(255,255,255,.65)" fontSize="13" textAnchor="middle" fontFamily="Bebas Neue" letterSpacing="3">END ZONE</text>
      <text x={w*.5} y={h-ez*.34} fill="rgba(255,255,255,.65)" fontSize="13" textAnchor="middle" fontFamily="Bebas Neue" letterSpacing="3">END ZONE</text>
      <path d={`M ${w*.45} 3 H ${w*.55} M ${w*.5} 3 V ${ez*.55}`} stroke="#ffd24a" strokeWidth="2.5" fill="none"/>
      <path d={`M ${w*.45} ${h-3} H ${w*.55} M ${w*.5} ${h-3} V ${h-ez*.55}`} stroke="#ffd24a" strokeWidth="2.5" fill="none"/>
      <rect width={w} height={h} fill="none" stroke={line} strokeWidth="3"/></g>;}
  if (cfg.field==="basketball") return <g><rect width={w} height={h} fill="url(#wood)"/><rect width={w} height={h} fill="none" stroke={line} strokeWidth="3"/>
      <rect x={w*.34} y="0" width={w*.32} height={h*.28} fill="none" stroke={line} strokeWidth="2"/><circle cx={w*.5} cy={h*.28} r={w*.1} fill="none" stroke={line} strokeWidth="2"/>
      <line x1={w*.43} y1={h*.035} x2={w*.57} y2={h*.035} stroke="#fff" strokeWidth="3"/><circle cx={w*.5} cy={h*.06} r="7" fill="none" stroke="#ff8c42" strokeWidth="3"/><path d={`M ${w*.07} 0 Q ${w*.5} ${h*.62} ${w*.93} 0`} fill="none" stroke={line} strokeWidth="2"/>
      <circle cx={w*.5} cy={h} r={w*.14} fill="none" stroke={line} strokeWidth="2"/></g>;
  if (cfg.field==="volleyball") return <g><rect width={w} height={h} fill="url(#court)"/><rect width={w} height={h} fill="none" stroke={line} strokeWidth="3"/>
      <line x1="0" y1={h*.35} x2={w} y2={h*.35} stroke={faint} strokeWidth="2" strokeDasharray="8 6"/>
      <line x1="0" y1={h*.65} x2={w} y2={h*.65} stroke={faint} strokeWidth="2" strokeDasharray="8 6"/>
      <line x1="0" y1={h*.5} x2={w} y2={h*.5} stroke="#fff" strokeWidth="6"/>
      <g opacity=".5">{Array.from({length:24}).map((_,i)=><line key={i} x1={(w/24)*i} y1={h*.5-7} x2={(w/24)*i} y2={h*.5+7} stroke="#fff" strokeWidth="1"/>)}</g>
      <text x={w*.5} y={h*.5-11} fill="#fff" fontSize="14" textAnchor="middle" fontFamily="Bebas Neue" letterSpacing="3">NET</text></g>;
  if (cfg.field==="tennis") return <g><rect width={w} height={h} fill="url(#clay)"/><rect x={w*.08} y={h*.06} width={w*.84} height={h*.88} fill="none" stroke={line} strokeWidth="3"/>
      <line x1="0" y1={h*.5} x2={w} y2={h*.5} stroke="#fff" strokeWidth="4"/><line x1={w*.2} y1={h*.06} x2={w*.2} y2={h*.94} stroke={faint} strokeWidth="2"/>
      <line x1={w*.8} y1={h*.06} x2={w*.8} y2={h*.94} stroke={faint} strokeWidth="2"/><line x1={w*.2} y1={h*.31} x2={w*.8} y2={h*.31} stroke={faint} strokeWidth="2"/>
      <line x1={w*.2} y1={h*.69} x2={w*.8} y2={h*.69} stroke={faint} strokeWidth="2"/><line x1={w*.5} y1={h*.31} x2={w*.5} y2={h*.69} stroke={faint} strokeWidth="2"/>
      <text x={w*.5} y={h*.48} fill={line} fontSize="15" textAnchor="middle" fontFamily="Barlow">NET</text></g>;
  if (cfg.field==="diamond"){ const cx=w*.5,home=h*.85,second=h*.32,side=w*.27,mid=(home+second)/2;
    return <g><rect width={w} height={h} fill="url(#grass)"/><path d={`M ${cx} ${home} L ${w*.07} ${h*.5} L ${cx} ${h*.07} L ${w*.93} ${h*.5} Z`} fill="rgba(160,110,60,.18)" stroke={faint} strokeWidth="2"/>
      <polygon points={`${cx},${home} ${cx+side},${mid} ${cx},${second} ${cx-side},${mid}`} fill="none" stroke={line} strokeWidth="2.5"/><circle cx={cx} cy={mid} r="22" fill="rgba(160,110,60,.4)" stroke={faint} strokeWidth="2"/>
      {[[cx,home],[cx+side,mid],[cx,second],[cx-side,mid]].map((b,i)=><rect key={i} x={b[0]-6} y={b[1]-6} width="12" height="12" fill="#fff" transform={`rotate(45 ${b[0]} ${b[1]})`}/>)}
      <rect width={w} height={h} fill="none" stroke={line} strokeWidth="3"/></g>;}
  if (cfg.field==="pool"){ const lanes=6,els=[]; for(let i=1;i<lanes;i++) els.push(<line key={i} x1={w*i/lanes} y1="0" x2={w*i/lanes} y2={h} stroke="#fff" strokeWidth="2" strokeDasharray="14 10" opacity=".7"/>);
    return <g><rect width={w} height={h} fill="url(#pool)"/>{els}<line x1="0" y1={h*.08} x2={w} y2={h*.08} stroke="#fff" strokeWidth="5"/><line x1="0" y1={h*.92} x2={w} y2={h*.92} stroke="#ffd24a" strokeWidth="5"/><rect width={w} height={h} fill="none" stroke={line} strokeWidth="3"/></g>;}
  if (cfg.field==="ring"){ const ins=[26,42,58]; return <g><rect width={w} height={h} fill="url(#canvas)"/>
      {ins.map((d,i)=><rect key={i} x={d} y={d} width={w-2*d} height={h-2*d} fill="none" stroke={i===0?line:"#d9c089"} strokeWidth={i===0?3:2}/>)}
      {[[26,26],[w-26,26],[26,h-26],[w-26,h-26]].map((c,i)=><circle key={i} cx={c[0]} cy={c[1]} r="9" fill={i<2?"#ff5a5a":"#3b82f6"}/>)}</g>;}
  if (cfg.field==="octagon"){ const cx=w*.5,cy=h*.5,R=w*.45,pts=[]; for(let k=0;k<8;k++){ const a=Math.PI/8+k*Math.PI/4; pts.push(`${(cx+R*Math.cos(a)).toFixed(1)},${(cy+R*Math.sin(a)).toFixed(1)}`);}
    return <g><polygon points={pts.join(" ")} fill="url(#cage)" stroke={line} strokeWidth="3"/><circle cx={cx} cy={cy} r={w*.12} fill="none" stroke={faint} strokeWidth="2"/></g>;}
  if (cfg.field==="mat"){ const cx=w*.5,cy=h*.5; return <g><rect width={w} height={h} fill="url(#canvas)"/>
      <circle cx={cx} cy={cy} r={w*.46} fill="#caa15a" stroke={line} strokeWidth="3"/>
      <circle cx={cx} cy={cy} r={w*.30} fill="none" stroke="#8a6d34" strokeWidth="2"/>
      <circle cx={cx} cy={cy} r={w*.10} fill="none" stroke={line} strokeWidth="2"/>
      <line x1={cx-w*.07} y1={cy-w*.02} x2={cx+w*.07} y2={cy-w*.02} stroke="#ff5a5a" strokeWidth="4"/>
      <line x1={cx-w*.07} y1={cy+w*.02} x2={cx+w*.07} y2={cy+w*.02} stroke="#3b82f6" strokeWidth="4"/></g>;}
  if (cfg.field==="lacrosse") return <g><rect width={w} height={h} fill="url(#grass)"/><rect width={w} height={h} fill="none" stroke={line} strokeWidth="3"/>
      <line x1="0" y1={h*.5} x2={w} y2={h*.5} stroke={line} strokeWidth="2.5"/>
      <line x1="0" y1={h*.3} x2={w} y2={h*.3} stroke={faint} strokeWidth="1.5" strokeDasharray="9 7"/>
      <line x1="0" y1={h*.7} x2={w} y2={h*.7} stroke={faint} strokeWidth="1.5" strokeDasharray="9 7"/>
      <circle cx={w*.5} cy={h*.5} r={h*.05} fill="none" stroke={faint} strokeWidth="2"/>
      {[0.12,0.88].map((gy,i)=><g key={i}><circle cx={w*.5} cy={h*gy} r={w*.11} fill="none" stroke={faint} strokeWidth="2"/>
        <rect x={w*.5-13} y={h*gy-7} width="26" height="14" fill="rgba(255,255,255,.12)" stroke="#fff" strokeWidth="2.5"/></g>)}
    </g>;
  if (cfg.field==="custom") return <g><rect width={w} height={h} rx="14" fill="url(#neutral)"/><rect x="6" y="6" width={w-12} height={h-12} rx="10" fill="none" stroke={line} strokeWidth="2.5"/>
      <line x1="0" y1={h*.5} x2={w} y2={h*.5} stroke={faint} strokeWidth="2" strokeDasharray="10 8"/><circle cx={w*.5} cy={h*.5} r={h*.16} fill="none" stroke={faint} strokeWidth="2"/>
      <text x={w*.5} y={h*.5+5} fill={faint} fontSize="22" textAnchor="middle" fontFamily="Bebas Neue" letterSpacing="2">{(customName||"YOUR SPORT").toUpperCase()}</text></g>;
  const v=cfg.variant, box=v==="soccer", center=["soccer","hockey"].includes(v), ends=[0,h];
  return <g><rect width={w} height={h} fill={`url(#${fillId})`}/><rect width={w} height={h} fill="none" stroke={line} strokeWidth="3"/>
    <line x1="0" y1={h*.5} x2={w} y2={h*.5} stroke={v==="hockey"?"#e24a4a":line} strokeWidth={v==="hockey"?4:2.5}/>
    {center && <circle cx={w*.5} cy={h*.5} r={h*.1} fill="none" stroke={line} strokeWidth="2"/>}
    {v==="hockey" && ends.map((e,i)=><line key={i} x1="0" y1={i?h*.64:h*.36} x2={w} y2={i?h*.64:h*.36} stroke="#3b82f6" strokeWidth="3"/>)}
    {box && ends.map((e,i)=>{const t=i===0;return <rect key={i} x={w*.28} y={t?0:h-h*.13} width={w*.44} height={h*.13} fill="none" stroke={line} strokeWidth="2"/>;})}
    {["soccer","hockey"].includes(v) && ends.map((e,i)=>{const t=i===0; const gh=h*.045; const ny=t?0:h-gh;
      return <g key={i}><rect x={w*.4} y={ny} width={w*.2} height={gh} fill="rgba(255,255,255,.14)" stroke="#fff" strokeWidth="3"/>
        <line x1={w*.45} y1={ny} x2={w*.45} y2={ny+gh} stroke="rgba(255,255,255,.45)" strokeWidth="1"/>
        <line x1={w*.5} y1={ny} x2={w*.5} y2={ny+gh} stroke="rgba(255,255,255,.45)" strokeWidth="1"/>
        <line x1={w*.55} y1={ny} x2={w*.55} y2={ny+gh} stroke="rgba(255,255,255,.45)" strokeWidth="1"/></g>;})}
  </g>;
});

function rPath(start,pts,vb){ const a=[[start.x*vb[0],start.y*vb[1]],...pts.map(r=>[r.x*vb[0],r.y*vb[1]])]; return a.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" "); }
const BALLS = {
  football:{kind:"football", def:{x:.5,y:.64}, goal:{x:.5,y:.06}},
  basketball:{kind:"basketball", def:{x:.5,y:.7}, goal:{x:.5,y:.12}},
  soccer:{kind:"soccer", def:{x:.5,y:.5}, goal:{x:.5,y:.05}},
  volleyball:{kind:"volleyball", def:{x:.5,y:.62}, goal:{x:.5,y:.2}},
  hockey:{kind:"puck", def:{x:.5,y:.6}, goal:{x:.5,y:.06}},
  lacrosse:{kind:"lacrosse", def:{x:.5,y:.55}, goal:{x:.5,y:.1}},
  custom:{kind:"generic", def:{x:.5,y:.6}, goal:{x:.5,y:.08}},
};
const TENNIS_STRATS = {
  offense:[
    {k:"Big Serve", desc:"Crack a flat first serve into the corner of the box and look for a quick finish."},
    {k:"Serve & Volley", desc:"Serve and follow it to the net to cut off the return with a volley."},
    {k:"Aggressive Baseline", desc:"Rip the forehand and push your opponent off the court, then open the angle."},
    {k:"Cross-Court Grinder", desc:"Trade heavy cross-court balls, build the point, and wait for the short ball."},
    {k:"Drop & Lob", desc:"Pull them forward with a drop shot, then lob over them when they charge."},
    {k:"Inside-Out Forehand", desc:"Run around the backhand and rip the inside-out forehand into the open court."},
    {k:"Body Serve + 1", desc:"Jam the returner with a body serve, then take the weak reply early."},
  ],
  defense:[
    {k:"Deep Counterpunch", desc:"Absorb the pace and send deep returns to reset the rally from defense."},
    {k:"Block & Reset", desc:"Short, compact swing to block the big serve back and neutralize it."},
    {k:"Lob the Rusher", desc:"When they serve and volley, lob over their shoulder and flip the point."},
    {k:"Slice & Slow", desc:"Float low slices to take time away and break their rhythm."},
    {k:"Scramble & Pass", desc:"Run everything down and look for the passing shot down the line."},
  ],
};
function tennisReady(doubles, serveTop){
  const bB=.84,bT=.16;
  const you = doubles?[{x:.34,y:bB},{x:.66,y:bB}]:[{x:.5,y:bB}];
  const opp = doubles?[{x:.34,y:bT},{x:.66,y:bT}]:[{x:.5,y:bT}];
  const ss = serveTop?{x:.6,y:.13}:{x:.6,y:.87};
  if(serveTop) opp[0]={...ss}; else you[0]={...ss};
  return {ball:{...ss}, you, opp};
}
function genRally({serveTop, doubles, stratKey}){
  const bB=.84,bT=.16, R=()=>Math.random(), cc=v=>Math.max(.08,Math.min(.92,v)), pick=a=>a[R()*a.length|0];
  let len;
  if(/Big Serve/.test(stratKey)) len=1+(R()<.5?0:1);
  else if(/Volley|Rusher/.test(stratKey)) len=2+(R()<.6?0:1);
  else if(/Grinder|Counter|Slice|Baseline|Scramble/.test(stratKey)) len=5+(R()*6|0);
  else if(/Drop|Lob/.test(stratKey)) len=3+(R()*3|0);
  else len=3+(R()*4|0);
  const serveTypes=/Big Serve/.test(stratKey)?["flat bomb into the corner","flat first serve down the T","heavy serve out wide"]
    :/Body/.test(stratKey)?["body serve to jam the returner"]:["flat serve down the T","slice serve out wide","kick serve up the middle","first serve into the body"];
  const serve=pick(serveTypes);
  let you = doubles?[{x:.34,y:bB},{x:.66,y:bB}]:[{x:.5,y:bB}];
  let opp = doubles?[{x:.34,y:bT},{x:.66,y:bT}]:[{x:.5,y:bT}];
  const deuce=R()<.5, ss = serveTop?{x:deuce?.4:.6,y:.13}:{x:deuce?.6:.4,y:.87};
  if(serveTop) opp[0]={...ss}; else you[0]={...ss};
  const frames=[{ball:{...ss}, you:you.map(p=>({...p})), opp:opp.map(p=>({...p}))}];
  let toTop = !serveTop;
  let target = toTop?{x:deuce?.38:.62,y:.42}:{x:deuce?.62:.38,y:.58};
  for(let i=0;i<len;i++){
    if(toTop){ let idx=opp.length>1?(Math.abs(opp[0].x-target.x)<=Math.abs(opp[1].x-target.x)?0:1):0;
      opp=opp.map((p,j)=> j===idx?{x:target.x,y:target.y}:{x:doubles?(j===0?.4:.6):.5,y:bT+.05});
      you=you.map((p,j)=>({x:doubles?(j===0?.4:.6):.5,y:bB-.03})); }
    else { let idx=you.length>1?(Math.abs(you[0].x-target.x)<=Math.abs(you[1].x-target.x)?0:1):0;
      you=you.map((p,j)=> j===idx?{x:target.x,y:target.y}:{x:doubles?(j===0?.4:.6):.5,y:bB-.05});
      opp=opp.map((p,j)=>({x:doubles?(j===0?.4:.6):.5,y:bT+.03})); }
    frames.push({ball:{x:target.x,y:target.y}, you:you.map(p=>({...p})), opp:opp.map(p=>({...p}))});
    toTop=!toTop; const recv=toTop?opp:you, ax=recv.reduce((a,p)=>a+p.x,0)/recv.length;
    // last shot drives into the open court (away from the receiver)
    const lastOne = i===len-1;
    const sx = lastOne ? (ax<.5?.78:.22) : (ax<.5?.62+R()*.12:.26+R()*.12);
    target={x:cc(sx), y:cc(toTop?.16+R()*.24:.6+R()*.24)};
  }
  frames.push({ball:{x:target.x,y:target.y}, you:you.map(p=>({...p})), opp:opp.map(p=>({...p}))});
  const youServe=!serveTop;
  const winners=["forehand winner cross-court","backhand down the line","inside-out forehand into the open court","swinging volley put-away","topspin lob over the head","drop-shot winner","passing shot down the line","backhand slice that skids away"];
  const errors=["the reply sails just long","a forehand clipped into the net","an overcooked backhand drifts wide"];
  const shape = len<=1?"Ace.":len<=2?"Quick one-two punch.":len>=6?`Long baseline battle (${len} shots).`:`Built the point (${len} shots).`;
  let outcome;
  if(/Big Serve/.test(stratKey)&&len<=1){ outcome = youServe?`Serve — ${serve}. Ace, unreturnable!`:`The opponent's ${serve} is an ace past you.`; }
  else { const won=R()<.72; const finish=won?`a ${pick(winners)}`:pick(errors);
    outcome = `Serve — ${serve}. ${shape} Point ends with ${finish}` + (won?"!":".");
    if(!youServe&&won) outcome = `You defend it — ${serve} returned, ${shape.toLowerCase()} You finish with a ${pick(winners)}!`; }
  return {frames, outcome};
}
const GOLF_CLUBS = [
  {k:"Driver", base:280, disp:.13}, {k:"3-Wood", base:248, disp:.11}, {k:"5-Wood", base:225, disp:.10},
  {k:"Hybrid", base:205, disp:.085}, {k:"4-Iron", base:190, disp:.08}, {k:"5-Iron", base:178, disp:.07},
  {k:"6-Iron", base:165, disp:.065}, {k:"7-Iron", base:152, disp:.06}, {k:"8-Iron", base:140, disp:.055},
  {k:"9-Iron", base:128, disp:.05}, {k:"PW", base:115, disp:.045}, {k:"GW", base:95, disp:.04},
  {k:"SW", base:75, disp:.04}, {k:"LW", base:58, disp:.035}, {k:"Putter", base:0, disp:.02},
];
const GOLF_COURSES = [
  {name:"Augusta National", sub:"Home of the Masters", holes:[
    {p:4,y:445,n:"Tea Olive"},{p:5,y:575,n:"Pink Dogwood"},{p:4,y:350,n:"Flowering Peach"},{p:3,y:240,n:"Flowering Crab Apple"},
    {p:4,y:495,n:"Magnolia"},{p:3,y:180,n:"Juniper"},{p:4,y:450,n:"Pampas"},{p:5,y:570,n:"Yellow Jasmine"},{p:4,y:460,n:"Carolina Cherry"},
    {p:4,y:495,n:"Camellia"},{p:4,y:520,n:"White Dogwood"},{p:3,y:155,n:"Golden Bell"},{p:5,y:510,n:"Azalea"},{p:4,y:440,n:"Chinese Fir"},
    {p:5,y:550,n:"Firethorn"},{p:3,y:170,n:"Redbud"},{p:4,y:440,n:"Nandina"},{p:4,y:465,n:"Holly"} ]},
  {name:"Pebble Beach", sub:"Cliffs of the Pacific", holes:[
    {p:4,y:380},{p:5,y:500},{p:4,y:390},{p:4,y:330},{p:3,y:190},{p:5,y:510},{p:3,y:105},{p:4,y:420},{p:4,y:460},
    {p:4,y:450},{p:4,y:380},{p:3,y:200},{p:4,y:400},{p:5,y:560},{p:4,y:400},{p:4,y:400},{p:3,y:180},{p:5,y:540} ]},
  {name:"St Andrews (Old)", sub:"The home of golf", holes:[
    {p:4,y:375},{p:4,y:455},{p:4,y:400},{p:4,y:480},{p:5,y:570},{p:4,y:415},{p:4,y:390},{p:3,y:180},{p:4,y:350},
    {p:4,y:380},{p:3,y:175},{p:4,y:350},{p:4,y:465},{p:5,y:620},{p:4,y:455},{p:4,y:425},{p:4,y:460},{p:4,y:360} ]},
  {name:"Sandy Pines", sub:"Your friendly muni", holes:[
    {p:4,y:360},{p:3,y:165},{p:5,y:500},{p:4,y:380},{p:4,y:400},{p:3,y:150},{p:4,y:410},{p:5,y:505},{p:4,y:390},
    {p:4,y:370},{p:4,y:395},{p:3,y:160},{p:5,y:510},{p:4,y:400},{p:4,y:385},{p:3,y:170},{p:4,y:400},{p:5,y:495} ]},
];
const golfPar=(c)=> GOLF_COURSES[c].holes.reduce((a,h)=>a+h.p,0);
function golfCaddie(dist){
  if(dist<=0.6) return {idx:14, txt:"Tap it in."};
  if(dist<=12) return {idx:14, txt:"On the green — roll the putter and read the break."};
  if(dist<=35){ const i = dist<=22?13:12; return {idx:i, txt:`Soft wedge — ${GOLF_CLUBS[i].k} to carry it close.`}; }
  let best=0,bd=1e9; GOLF_CLUBS.forEach((c,i)=>{ if(c.base>0){ const d=Math.abs(c.base-dist); if(d<bd){bd=d;best=i;} } });
  if(dist>GOLF_CLUBS[0].base) best=0;
  return {idx:best, txt:`${Math.round(dist)} to the pin — ${GOLF_CLUBS[best].k} is the play.`};
}
function golfSwing(dist, clubIdx, power){
  const club=GOLF_CLUBS[clubIdx]; const onGreen=dist<=12;
  if(clubIdx===14){
    const putt = dist*(power/100)*(0.9+Math.random()*0.22); let nd=Math.abs(dist-putt);
    if(nd<0.7 || (dist<6 && Math.random()<0.18)) return {dist:0, pen:0, holed:true, note:onGreen?"Drained it!":"In the hole!"};
    return {dist:nd, pen:0, holed:false, note:`Putt to ${nd<3?Math.round(nd*3)+" ft":Math.round(nd)+" yds"}.`};
  }
  let carry = club.base*(power/100)*(1 + (Math.random()*2-1)*club.disp);
  let nd = dist - carry; let note="", pen=0;
  if(nd<0){ nd=Math.abs(nd)*0.7; note="Carried past the pin."; }
  if(dist>40 && Math.random()<0.10){ pen=1; note = Math.random()<0.5?"Found a bunker — one to escape.":"In the water — penalty stroke."; }
  if(nd<0.7) return {dist:0, pen, holed:true, note:"Knocked it in!"};
  if(!note) note = nd<25?`Pin-high — ${Math.round(nd)} yds left.`:`${Math.round(nd)} yds to the pin.`;
  return {dist:nd, pen, holed:false, note};
}
function scoreName(d){ return d<=-3?"albatross":d===-2?"eagle":d===-1?"birdie":d===0?"par":d===1?"bogey":d===2?"double bogey":`+${d}`; }
function golfParLabel(n){ return n===0?"E":n>0?`+${n}`:`${n}`; }
function playFanfare(){
  try{
    const AC = (typeof window!=="undefined") && (window.AudioContext||window.webkitAudioContext); if(!AC) return;
    const ctx=new AC(), now=ctx.currentTime;
    const master=ctx.createGain(); master.gain.value=0.0001; master.connect(ctx.destination);
    master.gain.setValueAtTime(0.0001, now); master.gain.exponentialRampToValueAtTime(0.55, now+0.05);
    const note=(freq,start,dur)=>{ const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
      o.type="sawtooth"; o2.type="sawtooth"; o.frequency.value=freq; o2.frequency.value=freq; o2.detune.value=9;
      f.type="lowpass"; f.frequency.value=2400; o.connect(f); o2.connect(f); f.connect(g); g.connect(master);
      g.gain.setValueAtTime(0.0001, now+start); g.gain.exponentialRampToValueAtTime(0.22, now+start+0.04); g.gain.exponentialRampToValueAtTime(0.0001, now+start+dur);
      o.start(now+start); o2.start(now+start); o.stop(now+start+dur+0.05); o2.stop(now+start+dur+0.05); };
    const snare=(start)=>{ const len=0.07, buf=ctx.createBuffer(1, Math.floor(ctx.sampleRate*len), ctx.sampleRate), d=buf.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length); const s=ctx.createBufferSource(); s.buffer=buf;
      const g=ctx.createGain(); g.gain.value=0.16; const f=ctx.createBiquadFilter(); f.type="highpass"; f.frequency.value=1400;
      s.connect(f); f.connect(g); g.connect(master); s.start(now+start); };
    const N={G4:392,C5:523.25,E5:659.25,G5:783.99};
    [[N.G4,0,.18],[N.C5,.18,.18],[N.E5,.36,.18],[N.G5,.54,.36],[N.E5,.92,.16],[N.G5,1.08,.5],[N.C5,1.62,.22],[N.E5,1.84,.22],[N.G5,2.04,.7]].forEach(a=>note(a[0],a[1],a[2]));
    [N.C5,N.E5,N.G5].forEach(f=>note(f,2.04,0.7));
    for(let i=0;i<8;i++) snare(i*0.18);
    for(let i=0;i<5;i++) snare(1.95+i*0.055);
    master.gain.setValueAtTime(0.55, now+2.7); master.gain.exponentialRampToValueAtTime(0.0001, now+3.2);
    setTimeout(function(){ try{ctx.close();}catch(e){} }, 3600);
  }catch(e){}
}
const GOALS = { football:{x:.5,y:.07}, basketball:{x:.5,y:.1}, soccer:{x:.5,y:.05}, volleyball:{x:.5,y:.22}, hockey:{x:.5,y:.07}, lacrosse:{x:.5,y:.1}, custom:{x:.5,y:.08} };
const SCOREWORD = { football:"Touchdown!", basketball:"Bucket!", soccer:"Goal!", volleyball:"Kill!", hockey:"Goal!", boxing:"Lands clean!", mma:"Finish!", swimming:"Touch!", custom:"Score!" };
const PLAY_STRATS = {
  football:[
    {k:"Four Verticals", desc:"Send four receivers deep to stretch the coverage and hit the open seam."},
    {k:"Slant–Flat", desc:"Quick slant with a flat underneath to beat the blitz."},
    {k:"Play-Action Bomb", desc:"Fake the run, then take a shot deep over the top."},
    {k:"Power Run", desc:"Pull a lineman and run downhill behind the double team."},
    {k:"Screen Pass", desc:"Let the rush come, then dump it to the back with blockers out front."},
    {k:"Mesh Concept", desc:"Cross two receivers underneath to rub off the man coverage."},
    {k:"Smash Concept", desc:"Hitch underneath, corner over the top — high-low the cornerback and pick your read."},
    {k:"Flea Flicker", desc:"Hand it off, the back tosses it back to the QB, then launch it deep over the bitten safeties.", trick:true},
    {k:"Hook & Ladder", desc:"Receiver hooks it up, catches, and pitches to a trailing runner sprinting underneath.", trick:true},
    {k:"Philly Special", desc:"Direct snap to the back, reverse to a receiver, who throws it back to the quarterback in the flat.", trick:true},
    {k:"Statue of Liberty", desc:"Sell the deep pass, hide the ball, and hand it off behind your back the other way.", trick:true},
    {k:"Double Reverse", desc:"Two handoffs across the formation to spin the defense completely around.", trick:true},
    {k:"Tom Brady Pump-and-Go", desc:"Pump the hitch to freeze the corner, then blow the top off on the go route."},
    {k:"Texas Wheel", desc:"Back releases on a wheel out of the backfield while the slot clears the flat — nobody's home."},
    {k:"Dagger", desc:"Clear-out post drags the safety so the dig route sits down wide open in the middle."},
    {k:"Sluggo Seam", desc:"Slant-and-go off play-action — break it off, then take the seam past the biting defender."},
  ],
  basketball:[
    {k:"Pick & Roll", desc:"Set the ball screen, then the big rolls hard to the rim."},
    {k:"Kick-Out Three", desc:"Drive the lane to collapse the defense and kick to the open shooter."},
    {k:"Fast Break", desc:"Push it in transition before the defense sets for the numbers advantage."},
    {k:"Backdoor Cut", desc:"Read the overplay and cut behind the defender for the layup."},
    {k:"Isolation", desc:"Clear out a side and let your best scorer attack one-on-one."},
    {k:"Spain Pick-and-Roll", desc:"Ball screen with a back-screen on the roller's defender — the lob or the popped shooter, defense can't cover both."},
    {k:"Elevator Doors", desc:"Two bigs part like doors to let the shooter run through, then slam shut on the chaser for a clean three."},
    {k:"Hammer Action", desc:"Drive baseline one way, skip it cross-court to the weak-side corner three off a back-screen."},
    {k:"Floppy", desc:"Shooter chooses left or right off staggered screens — pick the defender's bad side."},
    {k:"Zipper into Flare", desc:"Cut up to the wing off a zipper, then flare-screen the catch for an instant pull-up."},
    {k:"Horns Flex", desc:"Two bigs at the elbows, flex cut underneath, and counter into a high ball screen."},
  ],
  soccer:[
    {k:"Tiki-Taka", desc:"Short give-and-go passing to unlock the defense, then slip it through."},
    {k:"Wing Overlap", desc:"Overlap the fullback, beat the line, and whip in the cross."},
    {k:"Counter-Attack", desc:"Win it and break fast into the space behind the back line."},
    {k:"Through Ball", desc:"Split the center backs with a perfectly weighted pass."},
    {k:"Third-Man Run", desc:"Bounce it off the striker to a runner the defense never tracked from deep.", trick:true},
    {k:"Overlap-Underlap Combo", desc:"Fake the overlap outside, cut underneath into the half-space, and slide the cutback."},
    {k:"Cruyff Turn Switch", desc:"Drag it back, switch the field with one touch, and attack the isolated full-back."},
  ],
  hockey:[
    {k:"Give & Go", desc:"Pass and drive to space for the return feed and shot."},
    {k:"Cycle Down Low", desc:"Work the puck along the boards to open the slot."},
    {k:"One-Timer", desc:"Set up the cross-ice feed for a one-time blast."},
    {k:"Odd-Man Rush", desc:"Attack with the extra man and force the goalie to commit."},
    {k:"Royal Road Slip", desc:"Slip it across the slot so the goalie has to slide post-to-post before the shot."},
    {k:"Behind-the-Net Wrap-and-Jam", desc:"Curl behind the cage, fake the wrap, and jam the back-door feed.", trick:true},
    {k:"Stretch Bomb", desc:"Spring the winger behind the D with a full-ice stretch pass for a breakaway.", trick:true},
  ],
  volleyball:[
    {k:"Quick Set", desc:"Fast middle attack to beat the block before it forms."},
    {k:"Outside Hit", desc:"High set to the pin for a big swing over the block."},
    {k:"Back-Row Attack", desc:"Set the back row to hit from behind the ten-foot line."},
    {k:"Slide & Pump", desc:"Middle fakes the quick and slides behind the setter — the block goes the wrong way."},
    {k:"Tandem (Stack)", desc:"Two attackers stack at one spot and split late so the blocker guesses wrong."},
  ],
  boxing:[
    {k:"Jab & Cross", desc:"Establish the jab, then land the straight behind it."},
    {k:"Counter-Puncher", desc:"Slip the lead and answer with the hook."},
    {k:"Body Attack", desc:"Invest in the body early to slow them down late."},
  ],
  mma:[
    {k:"Sprawl & Brawl", desc:"Stuff the takedown and punish on the feet."},
    {k:"Double-Leg", desc:"Change levels, drive through, and take top control."},
    {k:"Guard Pass", desc:"Pass the guard to mount and posture up for strikes."},
  ],
  swimming:[
    {k:"Negative Split", desc:"Build into the back half and finish faster than you started."},
    {k:"Fast Start", desc:"Explode off the blocks and ride the early speed."},
  ],
  custom:[
    {k:"Overload", desc:"Outnumber one side and exploit the advantage."},
    {k:"Spread & Attack", desc:"Stretch the field, then strike through the open space."},
  ],
  lacrosse:[
    {k:"Fast Break", desc:"Push in transition and attack before the defense sets — finish the odd-man rush."},
    {k:"2-3-1 Motion", desc:"Move the ball around the horn, draw a slide, and feed the open man."},
    {k:"Pick & Roll", desc:"Set an off-ball pick up top, spring the shooter, and dodge to the cage."},
    {k:"Dodge from X", desc:"Initiate behind the goal, dodge topside, and draw the slide for a feed."},
    {k:"Question Mark Dodge", desc:"Drive toward the cage, curl back out like a question mark, and snap the time-and-room shot."},
    {k:"The Shamrock", desc:"Three quick off-ball picks in a clover so the defense switches itself into a mismatch.", trick:true},
    {k:"Skip-Skip Wheel", desc:"Two cross-field skip passes beat the slide, then wheel the last feed to the open crease.", trick:true},
  ],
};
const DEF_SPORTS = new Set(["football","basketball","soccer","hockey","lacrosse"]);
function alignDefense(sport, offense){
  const rid=()=>"D"+Math.random().toString(36).slice(2,8);
  if(sport==="basketball"){
    return offense.map(p=>({ id:rid(), label:p.label, x:clamp(p.x), y:clamp(Math.max(.12,p.y-0.10)), route:[], team:"def" }));
  }
  if(sport==="soccer"||sport==="hockey"||sport==="lacrosse"){
    return makeFrom(DEF_DEFAULTS[sport]||DEFAULTS[sport]).map(p=>({...p, id:rid(), team:"def"}));
  }
  if(sport==="football"){
    const ol=offense.filter(p=>/^(LT|LG|C|RG|RT)$/.test(p.label));
    const los=ol.length? ol.reduce((a,p)=>a+p.y,0)/ol.length : 0.58;
    const cx=ol.length? ol.reduce((a,p)=>a+p.x,0)/ol.length : 0.5;
    const wr=offense.filter(p=>/^(X|Z|SL|H|Y|TE|WR)$/.test(p.label)).sort((a,b)=>a.x-b.x);
    const slot=offense.find(p=>/^(SL|H)$/.test(p.label));
    const D=[]; const mk=(label,x,y)=>D.push({id:rid(),label,x:clamp(x),y:clamp(y),route:[],team:"def"});
    mk("DE",cx-0.13,los-0.05); mk("DT",cx-0.045,los-0.05); mk("DT",cx+0.045,los-0.05); mk("DE",cx+0.13,los-0.05); // 4-man front on the LOS
    mk("LB",cx-0.08,los-0.15); mk("LB",cx+0.08,los-0.15); // 2 linebackers
    const left=wr.length?wr[0]:{x:0.13}, right=wr.length?wr[wr.length-1]:{x:0.87};
    mk("CB",left.x,los-0.10); mk("CB",right.x,los-0.10); // corners over the outside receivers
    mk("NB", slot?slot.x:cx+0.18, los-0.13); // nickel over the slot
    mk("FS",cx-0.05,los-0.34); mk("SS",cx+0.14,los-0.22); // 2 deep safeties
    return D; // 11
  }
  return [];
}
const SB_HAS = new Set(["football","basketball","soccer","hockey","lacrosse","baseball","softball","volleyball","tennis"]);
function defaultSB(s){ const b={home:0,away:0,clock:600,q:1,down:1,dist:10,yard:25,shot:24,inn:1,top:true,outs:0,set:1,per:1};
  if(s==="football")b.clock=900; else if(s==="soccer")b.clock=2700; else if(s==="hockey")b.clock=1200; else if(s==="lacrosse")b.clock=720; return b; }
function simOutcome(sport, key, deep){ const r=Math.random(), k=(key||"").toLowerCase();
  if(sport==="football"){
    if(/punt/.test(k)) return {t:`Punt away — ${38+Math.floor(r*18)} yards, downed.`,kind:"play"};
    if(/field goal/.test(k)) return r<0.82?{t:"The kick is up… and it's GOOD! 🏈",kind:"play",pts:3}:{t:"Field goal sails wide — no good.",kind:"def"};
    if(/kneel/.test(k)) return {t:"QB takes a knee — clock runs.",kind:"play"};
    if(/spike/.test(k)) return {t:"Spiked to stop the clock.",kind:"play"};
    if(/run|power|sweep|dive|qbrun|qb run/.test(k)){ if(r<0.04) return {t:"Fumble! It's on the turf 😬",kind:"def"}; const big=r<0.12; const yds=big?12+Math.floor(Math.random()*42):Math.max(-3,Math.floor(Math.random()*9)-1); return {t:`Handoff — ${yds<0?`stuffed for ${yds}`:`${yds} yards`}${big?", breaks it to the second level! 🔥":"."}`,kind:yds<0?"def":"play",yds}; }
    const comp = r < (deep?0.46:0.66);
    if(!comp){ const r2=Math.random(); if(r2<0.09) return {t:"INTERCEPTED — the defense jumps the route 🛑",kind:"def"}; if(r2<0.22) return {t:"Sacked! Pressure got home for a loss.",kind:"def"}; return {t:deep?"Incomplete — just overthrown deep.":"Incomplete — broken up at the catch point.",kind:"def"}; }
    const yds=deep?24+Math.floor(Math.random()*36):6+Math.floor(Math.random()*16); return {t:`Caught for ${yds} yards${yds>=40?" — TOUCHDOWN! 🔥":yds>=18?" — moves the chains!":"."}`,kind:"play",yds};
  }
  if(sport==="basketball"){ const three=/three|floppy|3|down|pindown|flare|double/.test(k);
    if(/spain/.test(k)) return r<0.5?{t:"Spain pick-and-roll — lob finished at the rim! 🔥🏀",kind:"play",pts:2}:(r<0.74?{t:"Spain action springs the popped shooter — three is GOOD!",kind:"play",pts:3}:{t:"Help rotates over — contested miss.",kind:"def"});
    if(/back/.test(k)) return r<0.66?{t:"Back screen — backdoor cut for the easy layup! 🏀",kind:"play",pts:2}:{t:"Defense reads the back-cut — broken up.",kind:"def"};
    if(/cross/.test(k)) return r<0.55?{t:"Cross screen seals the big — finishes on the block! 🏀",kind:"play",pts:2}:(r<0.70?{t:"And-1 on the seal!",kind:"play",pts:2}:{t:"Fronted in the post — entry denied.",kind:"def"});
    if(/pnp|pop/.test(k)) return r<0.47?{t:"Pick-and-pop — knocks down the open jumper! 🏀",kind:"play",pts:2}:{t:"Pop jumper is short — rebound.",kind:"def"};
    if(/flare/.test(k)) return r<0.42?{t:"Flare screen — wide-open skip-pass three! 🔥",kind:"play",pts:3}:{t:"Closeout contests the flare — off the mark.",kind:"def"};
    if(/screenbb|post/.test(k)) return r<0.55?{t:"Post-up — finishes through contact! 🏀",kind:"play",pts:2}:(r<0.70?{t:"And-1 in the post!",kind:"play",pts:2}:{t:"Tough miss inside — rebound loose.",kind:"def"});
    if(three) return r<0.39?{t:"Comes off the screen — SPLASH from three! 🔥",kind:"play",pts:3}:{t:"Three rims out — rebound.",kind:"def"};
    if(r<0.52) return {t:"Turns the corner — layup is GOOD! 🏀",kind:"play",pts:2};
    if(r<0.64) return {t:"And-1 at the rim — bucket and the foul!",kind:"play",pts:2};
    if(r<0.74) return {t:"Draws the foul — heading to the line.",kind:"play"};
    return {t:"Contested at the rim — defense holds.",kind:"def"};
  }
  if(sport==="soccer"||sport==="hockey"||sport==="lacrosse") return r<0.42?{t:"GOAL! Buries it in the net! 🥅🔥",kind:"play",pts:1}:(r<0.70?{t:"Saved! The keeper gets a piece of it.",kind:"def"}:{t:"Shot just misses the frame.",kind:"def"});
  if(sport==="volleyball") return r<0.60?{t:"KILL — terminates the rally! 🏐",kind:"play",pts:1}:(r<0.80?{t:"Dug up — rally stays alive.",kind:"def"}:{t:"Stuffed at the net!",kind:"def"});
  return {t:"Clean rep — well executed.",kind:"play"};
}
function describePlay(sport, players, text){
  const t=(text||"").toLowerCase(); const body=(text||"").trim()||"Custom play";
  const off=players.filter(p=>p.team!=="def").map(p=>({...p,team:"off"})); const use=off.length?off:players.map(p=>({...p}));
  if(sport==="basketball"){
    const map=[["spain","SPAIN"],["pick and pop","PNP"],["pick-and-pop","PNP"],["pick & pop","PNP"],["pop","PNP"],["flare","FLARE"],["double","DOUBLE"],["backdoor","BACK"],["back screen","BACK"],["back-screen","BACK"],["down screen","DOWN"],["pin","DOWN"],["cross","CROSS"],["step up","STEPUP"],["step-up","STEPUP"],["drag","DRAG"],["horns","HORNS"],["side pick","SIDEPNR"],["iso","ISO"],["post","POST"],["three","THREE"],["pick and roll","PNR"],["pick-and-roll","PNR"],["pick & roll","PNR"],["pnr","PNR"],["roll","PNR"],["screen","PNR"]];
    let call="PNR"; for(const [k,v] of map){ if(t.includes(k)){ call=v; break; } }
    const o=genSituational("basketball", use, call, "Your play", body); o.info={...o.info, title:"Your play", body}; return o;
  }
  const o=genTeamPlay(sport, use); o.info={...(o.info||{}), title:"Your play", body}; return o;
}
function genTeamPlay(sport, players){
  const list = PLAY_STRATS[sport]||PLAY_STRATS.custom;
  const strat = list[Math.floor(Math.random()*list.length)];
  const goal = GOALS[sport]||GOALS.custom;
  if(DEF_SPORTS.has(sport) && !players.some(p=>p.team==="def")){
    const offMarked=players.map(p=>({...p,team:p.team||"off"}));
    players=[...offMarked, ...alignDefense(sport, offMarked)];
  }
  let off = players.filter(p=>p.team!=="def"); if(!off.length) off = players.slice();
  const offIds = new Set(off.map(p=>p.id));
  const netSport = sport==="soccer"||sport==="hockey"||sport==="lacrosse";
  const isGoalie = (p)=> netSport && (p.label==="GK"||p.label==="G");
  const fielders = off.filter(p=>!isGoalie(p)); const pool = fielders.length?fielders:off;
  let handler = pool.reduce((a,p)=>p.y>a.y?p:a, pool[0]);
  const qb = (sport==="football" && off.find(p=>p.label==="QB")) || handler;
  const ends={};
  const newPlayers = players.map(p=>{
    if(!offIds.has(p.id)){
      if(sport==="football" && p.team==="def" && /^(DE|DT|NT|DL)$/.test(p.label) && Math.random()<0.99){
        return {...p, route:[{x:clamp(qb.x+(Math.random()-.5)*.06), y:clamp(qb.y+0.02)}], routeType:"run"};
      }
      return p;
    }
    if(isGoalie(p)){ ends[p.id]={x:p.x,y:p.y}; return {...p, route:[]}; }
    if(p.id===handler.id){ if(sport==="football" && p.label==="QB"){ ends[p.id]={x:p.x,y:p.y}; return {...p, route:[]}; } const e={x:clamp(p.x+(Math.random()-.5)*.05), y:clamp(p.y-.05)}; ends[p.id]=e; return {...p, route:[e], routeType:"run", ease:"both"}; }
    if(sport==="football"){
      if(/^(LT|LG|C|RG|RT)$/.test(p.label)){ const pull=Math.random()<.22; const wp=pull?[{x:clamp(p.x),y:clamp(p.y-.03)},{x:clamp(p.x<.5?p.x+.13:p.x-.13),y:clamp(p.y-.05)}]:routeTree("block",p.x,p.y); ends[p.id]=wp[wp.length-1]; return {...p, route:wp, routeType:"run", ease:"out"}; }
      if(/^(RB|FB)$/.test(p.label)){ const out=Math.random()<.45; const wp=out?routeTree("wheel",p.x,p.y):[{x:clamp(p.x+(Math.random()<.5?.08:-.08)),y:clamp(p.y-.16)},{x:clamp(p.x+(Math.random()-.5)*.06),y:clamp(p.y-.4)}]; ends[p.id]=wp[wp.length-1]; return {...p, route:wp, routeType:out?"pass":"run", ease:"out"}; }
      const kind=["go","post","corner","out","in","slant","comeback"][Math.floor(Math.random()*7)]; const wp=routeTree(kind,p.x,p.y); ends[p.id]=wp[wp.length-1]; return {...p, route:wp, routeType:"pass", ease:"out"}; }
    // other sports: curved two-step route toward goal, slight weave
    const dirx=(goal.x-p.x), s1={x:clamp(p.x+dirx*0.25+(Math.random()-.5)*.12), y:clamp(p.y-(0.12+Math.random()*0.16))}, s2={x:clamp(p.x+dirx*0.55+(Math.random()-.5)*.08), y:clamp(p.y-(0.26+Math.random()*0.34))};
    ends[p.id]=s2; return {...p, route:[s1,s2], routeType: Math.random()<.45?"pass":"run", ease:"both"};
  });
  const cand = newPlayers.filter(p=>offIds.has(p.id) && p.id!==handler.id && !isGoalie(p));
  const target = cand.length ? cand.reduce((a,p)=>ends[p.id].y<ends[a.id].y?p:a, cand[0]) : handler;
  const tEnd = ends[target.id]||{x:handler.x,y:handler.y};
  const passLike = sport==="football" ? !/Run|Power|Sweep|Dive/i.test(strat.k) : true;
  let ball;
  if(strat.trick && cand.length>=2){
    const near = cand.reduce((a,p)=>ends[p.id].y>ends[a.id].y?p:a, cand[0]);
    ball = { x:handler.x, y:handler.y, delay:0.32, ease:"out", route:[ ends[near.id], {x:handler.x,y:handler.y}, tEnd, {x:goal.x,y:goal.y} ] };
  } else {
    ball = { x:handler.x, y:handler.y, delay: passLike?0.46:0.16, ease:"out", route:[ tEnd, {x:goal.x,y:goal.y} ] };
  }
  const deep = sport==="football" && tEnd.y < 0.34;
  const outcome = simOutcome(sport, strat.k, deep);
  // defenders react — close on the ball's target (coverage/pursuit)
  const withDef = newPlayers.map(p=>{
    if(offIds.has(p.id) || isGoalie(p)) return p;
    if(p.route && p.route.length) return p; // already rushing (DL)
    const cx=p.x+(tEnd.x-p.x)*0.62, cy=p.y+(tEnd.y-p.y)*0.62;
    return {...p, route:[{x:clamp(cx),y:clamp(cy)}], routeType:"run", ease:"both", delay:0.16};
  });
  return { players:withDef, ball, info:{ title:strat.k, body:`${strat.desc} ${SCOREWORD[sport]||"Score!"}`, kind:"play", outcome } };
}
const freshBall=(s)=> BALLS[s]?{x:BALLS[s].def.x,y:BALLS[s].def.y,route:[]}:null;
const BB_SCREEN_SET=new Set(["PNR","PNP","SIDEPNR","STEPUP","DRAG","HORNS","SPAIN","DOWN","PINDOWN","FLARE","DOUBLE","BACK","CROSS"]);
function buildBBScreen(players, call, title, body){
  const goal=GOALS.basketball||GOALS.custom; const C=v=>clamp(v);
  let off=players.filter(p=>p.team!=="def").map(p=>({...p,team:"off"})); if(!off.length) off=players.map(p=>({...p,team:"off"}));
  const existingDef=players.filter(p=>p.team==="def");
  // roles
  const handler=off.find(p=>p.label==="PG")||off.reduce((a,p)=>p.y>a.y?p:a,off[0]);
  let rest=off.filter(p=>p.id!==handler.id);
  const bigs=rest.filter(p=>/^(C|PF|BIG)$/.test(p.label));
  const wingsL=rest.filter(p=>!bigs.includes(p));
  const byRim=arr=>arr.slice().sort((a,b)=>a.y-b.y);
  const big1=bigs[0]||byRim(rest)[0];
  const big2=bigs[1]||byRim(rest.filter(p=>p!==big1))[0];
  const wing1=wingsL[0]||rest.find(p=>p!==big1&&p!==big2);
  const wing2=wingsL[1]||rest.find(p=>p!==big1&&p!==big2&&p!==wing1);
  const ss=handler.x<0.5?1:-1;                         // screen comes from strong side, pushes to middle
  const rimY=C(goal.y+0.05), rim={x:0.5,y:rimY};
  const route={}; // id -> {wp, type}
  const set=(p,wp,type)=>{ if(p) route[p.id]={wp:wp.map(w=>({x:C(w.x),y:C(w.y)})),type:type||"run"}; };
  const corner=(p,leftHint)=>{ if(!p) return; const left=leftHint!=null?leftHint:p.x<0.5; set(p,[{x:left?0.08:0.92,y:0.5}],"run"); };
  let ballId=handler.id, ballToGoal=false, tEnd=null, ballDelay=0.18;

  const screenSpot={x:handler.x+0.05*ss,y:handler.y-0.03};
  const useScreen=[{x:handler.x-0.05*ss,y:handler.y-0.05},{x:0.5,y:C(goal.y+0.16)},rim];

  if(call==="PNR"||call==="DRAG"){
    const start=call==="DRAG"?[{x:handler.x,y:C(handler.y+0.04)}]:[];
    set(handler,[...start,{x:handler.x-0.05*ss,y:handler.y-0.06},{x:0.5,y:C(goal.y+0.18)}],"run");
    set(big1,[screenSpot,{x:0.47,y:rimY}],"run");              // pick then roll to rim
    ballId=big1.id; tEnd={x:0.47,y:rimY}; ballDelay=0.4;       // dump to roller
    corner(wing1,true); corner(wing2,false); if(big2) set(big2,[{x:ss>0?0.86:0.14,y:C(goal.y+0.2)}],"run");
  } else if(call==="SIDEPNR"){
    // wing ball screen: handler attacks baseline
    set(handler,[{x:handler.x+0.06*ss,y:handler.y-0.03},{x:ss>0?0.16:0.84,y:C(goal.y+0.2)},{x:0.5,y:rimY}],"run");
    set(big1,[{x:handler.x+0.04*ss,y:handler.y-0.02},{x:0.5,y:rimY}],"run");
    ballId=big1.id; tEnd=rim; ballDelay=0.42;
    corner(wing1,true); corner(wing2,false); if(big2) set(big2,[{x:0.5,y:0.5}],"run");
  } else if(call==="STEPUP"){
    // screener steps UP from the baseline side, sends handler middle
    set(handler,[{x:0.5,y:handler.y-0.05},{x:0.5,y:C(goal.y+0.16)},rim],"run");
    set(big1,[{x:handler.x+0.05*ss,y:C(handler.y+0.05)},{x:0.46,y:rimY}],"run");
    ballId=handler.id; ballToGoal=true; tEnd=rim; ballDelay=0.18;
    corner(wing1,true); corner(wing2,false); if(big2) set(big2,[{x:ss>0?0.85:0.15,y:0.4}],"run");
  } else if(call==="HORNS"){
    // two bigs at elbows; use one, the other dives/pops
    set(handler,[{x:handler.x-0.05,y:handler.y-0.06},{x:0.5,y:C(goal.y+0.18)}],"run");
    if(big1) set(big1,[{x:0.4,y:handler.y-0.05},{x:0.46,y:rimY}],"run");      // ball-screen then roll
    if(big2) set(big2,[{x:0.6,y:handler.y-0.05},{x:0.62,y:0.46}],"pass");     // other pops
    ballId=(big1||handler).id; tEnd={x:0.46,y:rimY}; ballDelay=0.4;
    corner(wing1,true); corner(wing2,false);
  } else if(call==="PNP"){
    set(handler,[{x:handler.x-0.05*ss,y:handler.y-0.05},{x:0.5,y:C(goal.y+0.22)}],"run");
    set(big1,[screenSpot,{x:handler.x+0.2*ss,y:C(handler.y-0.01)}],"pass");   // screen then pop behind arc
    ballId=big1.id; tEnd={x:handler.x+0.2*ss,y:C(handler.y-0.01)}; ballDelay=0.42;
    corner(wing1,true); corner(wing2,false); if(big2) set(big2,[{x:0.5,y:rimY}],"run");
  } else if(call==="SPAIN"){
    set(handler,[{x:handler.x-0.05*ss,y:handler.y-0.06},{x:0.5,y:C(goal.y+0.18)}],"run");
    set(big1,[screenSpot,{x:0.47,y:rimY}],"run");                              // roll to rim (lob)
    set(wing1,[{x:0.5,y:C(handler.y-0.1)},{x:handler.x+0.22*ss,y:handler.y}],"pass"); // back-screen the roller's man, then pop
    ballId=big1.id; tEnd={x:0.47,y:rimY}; ballDelay=0.46;
    corner(wing2,false); if(big2) set(big2,[{x:ss>0?0.86:0.14,y:C(goal.y+0.2)}],"run");
  } else if(call==="DOWN"||call==="PINDOWN"){
    // big screens down low->free shooter coming up to the wing
    const shooter=wing1||big2; const side=shooter&&shooter.x<0.5?1:-1;
    if(big1) set(big1,[{x:0.5+0.28*-side,y:C(goal.y+0.28)},{x:0.5+0.22*-side,y:C(goal.y+0.2)}],"run");
    if(shooter) set(shooter,call==="PINDOWN"
      ?[{x:0.5+0.26*-side,y:C(goal.y+0.16)},{x:0.5+0.16*-side,y:0.42}]      // curl tight to elbow
      :[{x:0.5+0.3*-side,y:C(goal.y+0.18)},{x:0.5+0.34*-side,y:0.46}],"pass"); // come to the wing
    set(handler,[{x:handler.x,y:handler.y-0.02}],"run");
    ballId=(shooter||handler).id; tEnd=route[ballId]?route[ballId].wp[route[ballId].wp.length-1]:null; ballDelay=0.42;
    corner(wing2,wing2&&wing2.x<0.5);
  } else if(call==="FLARE"){
    const shooter=wing1||big2; const side=shooter&&shooter.x<0.5?-1:1; // flare AWAY from the ball
    if(big1) set(big1,[{x:handler.x-0.04*ss,y:C(handler.y-0.06)}],"run");   // back-pick
    if(shooter) set(shooter,[{x:shooter.x+0.06*side,y:C(shooter.y-0.04)},{x:side>0?0.9:0.1,y:0.46}],"pass");
    set(handler,[{x:handler.x+0.04,y:handler.y}],"run");
    ballId=(shooter||handler).id; tEnd=route[ballId]?route[ballId].wp[route[ballId].wp.length-1]:null; ballDelay=0.5; // skip pass
    corner(wing2,wing2&&wing2.x<0.5); if(big2&&big2!==shooter) set(big2,[{x:0.5,y:rimY}],"run");
  } else if(call==="DOUBLE"){
    const shooter=wing1||big2;
    if(big1) set(big1,[{x:0.4,y:C(goal.y+0.22)}],"run");
    if(big2&&big2!==shooter) set(big2,[{x:0.34,y:C(goal.y+0.24)}],"run");    // stacked screeners
    if(shooter) set(shooter,[{x:0.36,y:C(goal.y+0.3)},{x:0.12,y:0.5}],"pass"); // rub off both to the corner
    set(handler,[{x:handler.x,y:handler.y-0.02}],"run");
    ballId=(shooter||handler).id; tEnd=route[ballId]?route[ballId].wp[route[ballId].wp.length-1]:null; ballDelay=0.44;
    corner(wing2,false);
  } else if(call==="BACK"){
    const cutter=wing1||wing2; const side=cutter&&cutter.x<0.5?1:-1;
    if(big1) set(big1,[{x:cutter?cutter.x:0.6,y:C((cutter?cutter.y:0.5)-0.05)}],"run"); // set the back-screen
    if(cutter) set(cutter,[{x:cutter.x-0.04*side,y:cutter.y+0.02},{x:0.5,y:rimY}],"pass"); // backdoor to rim
    set(handler,[{x:handler.x+0.05,y:handler.y}],"run");
    ballId=(cutter||handler).id; tEnd=rim; ballDelay=0.4;
    corner(wing2&&wing2!==cutter?wing2:null,false); if(big2) set(big2,[{x:0.78,y:0.5}],"run");
  } else if(call==="CROSS"){
    const screener=wing1||handler; const postBig=big1; const side=postBig&&postBig.x<0.5?1:-1;
    if(screener&&screener!==handler) set(screener,[{x:0.5,y:C(goal.y+0.22)},{x:0.5-0.2*side,y:C(goal.y+0.2)}],"run"); // cross the lane to screen
    if(postBig) set(postBig,[{x:0.5+0.18*side,y:C(goal.y+0.16)},{x:0.5+0.24*side,y:C(goal.y+0.1)}],"pass");          // seal & post up
    set(handler,[{x:handler.x,y:handler.y-0.02}],"run");
    ballId=(postBig||handler).id; tEnd=route[ballId]?route[ballId].wp[route[ballId].wp.length-1]:null; ballDelay=0.42;
    corner(wing2,wing2&&wing2.x<0.5);
  }
  // spacing for anyone still unrouted
  off.forEach(p=>{ if(!route[p.id]) set(p,[{x:C(p.x+(p.x<.5?-0.05:0.05)),y:C(p.y-0.03)}],"run"); });
  if(!tEnd){ const e=route[ballId]; tEnd=e?e.wp[e.wp.length-1]:{x:handler.x,y:handler.y}; }

  const routedOff=off.map(p=>{ const r=route[p.id]; return r?{...p,route:r.wp,routeType:r.type,ease:"both"}:p; });
  let all;
  if(existingDef.length){ all=[...routedOff, ...existingDef.map(p=>({...p}))]; }
  else { all=[...routedOff, ...alignDefense("basketball", routedOff)]; }
  all=all.map(p=>{ if(p.team!=="def") return p; if(p.route&&p.route.length) return p;
    return {...p, route:[{x:C(p.x+(tEnd.x-p.x)*0.62),y:C(p.y+(tEnd.y-p.y)*0.62)}], routeType:"run", ease:"both", delay:0.16}; });
  const ball={ x:handler.x, y:handler.y, delay:ballDelay, ease:"out", route: ballToGoal?[tEnd,{x:goal.x,y:goal.y}]:[tEnd] };
  const outcome=simOutcome("basketball", call, false);
  return { players:all, ball, info:{ title, body:`${body} ${SCOREWORD.basketball||"Bucket!"}`, kind:"play", outcome } };
}
function genSituational(sport, players, call, title, body){
  if(sport==="basketball" && BB_SCREEN_SET.has(call)) return buildBBScreen(players, call, title, body);
  const goal=GOALS[sport]||GOALS.custom;
  if(DEF_SPORTS.has(sport) && !players.some(p=>p.team==="def")){
    const offMarked=players.map(p=>({...p,team:p.team||"off"}));
    players=[...offMarked, ...alignDefense(sport, offMarked)];
  }
  let off=players.filter(p=>p.team!=="def"); if(!off.length) off=players.slice();
  const offIds=new Set(off.map(p=>p.id));
  const handler=(sport==="football" && off.find(p=>p.label==="QB")) || off.reduce((a,p)=>p.y>a.y?p:a,off[0]);
  const ends={}; const setE=(p,x,y)=>{ const e={x:clamp(x),y:clamp(y)}; ends[p.id]=e; return e; };
  const isLine=l=>/^(LT|LG|C|RG|RT)$/.test(l), isRecv=l=>/^(X|Z|SL|H|Y|TE|WR)$/.test(l), isBack=l=>/^(RB|FB)$/.test(l);
  let ballId=null, ballToGoal=true; let recvN=0;
  const np=players.map(p=>{
    if(!offIds.has(p.id)){
      if(sport==="football" && p.team==="def" && /^(DE|DT|NT|DL)$/.test(p.label) && Math.random()<0.97) return {...p, route:[{x:clamp(handler.x+(Math.random()-.5)*.06),y:clamp(handler.y+.02)}], routeType:"run"};
      return p;
    }
    if(sport==="football"){
      const setR=(p,wp,rt)=>{ const e=wp[wp.length-1]; ends[p.id]=e; return {...p, route:wp, routeType:rt||"pass", ease:"out"}; };
      if(p.id===handler.id){ if(call==="QBRUN"){ if(!ballId) ballId=p.id; const wp=routeTree("go",p.x,p.y); ends[p.id]=wp[wp.length-1]; return {...p,route:wp,routeType:"run",ease:"both"}; } ends[p.id]={x:p.x,y:p.y}; return {...p, route:[]}; }
      if(isLine(p.label)){ return setR(p, routeTree("block",p.x,p.y), "run"); }
      if(isBack(p.label)){
        if(call==="RUN"||call==="POWER"){ if(!ballId) ballId=p.id; const dir=Math.random()<.5?1:-1; return setR(p,[{x:clamp(p.x+0.03*dir),y:clamp(p.y-0.06)},{x:clamp(p.x+0.10*dir),y:clamp(p.y-0.2)},{x:clamp(p.x+0.04*dir),y:clamp(p.y-0.44)}],"run"); }
        if(call==="SCREEN"){ if(!ballId) ballId=p.id; return setR(p, routeTree("flat",p.x,p.y), "pass"); }
        if(call==="SWING"){ if(!ballId) ballId=p.id; return setR(p, routeTree("wheel",p.x,p.y), "pass"); }
        if(call==="QBRUN"){ return setR(p, routeTree("block",p.x,p.y-0.06), "run"); }
        return setR(p, routeTree("flat",p.x,p.y), "pass"); }
      if(isRecv(p.label)){
        const slot=p.label==="SL"||p.label==="H";
        if(call==="BUBBLE"){ if(slot){ if(!ballId) ballId=p.id; return setR(p,[{x:clamp(p.x+(p.x<.5?-.06:.06)),y:clamp(p.y+0.03)},{x:clamp(p.x+(p.x<.5?-.12:.12)),y:clamp(p.y-0.05)}],"pass"); } return setR(p, routeTree("block",p.x,p.y),"run"); }
        let kind="go";
        if(call==="DEEP"||call==="PA"){ kind=["go","post","corner","go"][recvN%4]; }
        else if(call==="QUICK"){ kind=["slant","out","slant","in"][recvN%4]; }
        else if(call==="SCREEN"){ kind="block"; }
        else { kind="drag"; }
        recvN++;
        return setR(p, routeTree(kind,p.x,p.y), kind==="block"?"run":"pass"); }
      return p;
    }
    // basketball — cuts, screens, ball movement
    const big=/^(C|PF|BIG)$/.test(p.label), wing=/^(SG|SF|W)$/.test(p.label);
    const setW=(p,wp,rt)=>{ const e=wp[wp.length-1]; ends[p.id]=e; return {...p, route:wp, routeType:rt||"run", ease:"both"}; };
    if(p.id===handler.id){
      if(call==="ISO"){ return setW(p,[{x:clamp(p.x+(p.x<.5?.06:-.06)),y:clamp(p.y-0.1)},{x:.5,y:clamp(goal.y+0.1)}],"run"); }
      if(call==="PNR"||call==="PNP"){ return setW(p,[{x:clamp(p.x+0.05),y:clamp(p.y-0.04)},{x:clamp(p.x-0.06),y:clamp(p.y-0.16)},{x:.5,y:clamp(goal.y+0.12)}],"run"); }
      return setW(p,[{x:clamp(p.x+(Math.random()-.5)*.06),y:clamp(p.y-0.06)}],"run"); }
    if(call==="PNR" && big){ if(!ballId) ballId=p.id; return setW(p,[{x:clamp(handler.x+0.02),y:clamp(handler.y-0.05)},{x:.47,y:clamp(goal.y+0.05)}],"run"); }
    if(call==="PNP" && big){ if(!ballId){ ballId=p.id; ballToGoal=false; } return setW(p,[{x:clamp(handler.x+0.03),y:clamp(handler.y-0.05)},{x:clamp(handler.x<.5?handler.x+0.22:handler.x-0.22),y:clamp(handler.y-0.02)}],"pass"); }
    if(call==="SCREENBB" && big){ if(!ballId){ ballId=p.id; ballToGoal=false; } const sh=offIds; return setW(p,[{x:clamp(p.x+(p.x<.5?0.06:-0.06)),y:clamp(p.y+0.02)},{x:clamp(p.x+(p.x<.5?-0.04:0.04)),y:clamp(p.y-0.08)}],"pass"); }
    if(call==="POST" && big){ if(!ballId){ ballId=p.id; ballToGoal=false; } return setW(p,[{x:clamp(p.x+(p.x<.5?.04:-.04)),y:clamp(p.y+0.03)},{x:.4,y:clamp(goal.y+0.09)}],"pass"); }
    if((call==="THREE"||call==="FLOPPY") && wing){ if(!ballId){ ballId=p.id; ballToGoal=false; } return setW(p,[{x:clamp(p.x+(p.x<.5?-.05:.05)),y:clamp(p.y-0.04)},{x:p.x<.5?.12:.88,y:.5}],"pass"); }
    if((call==="PNP"||call==="SCREENBB") && wing){ return setW(p,[{x:clamp(p.x+(p.x<.5?-.06:.06)),y:clamp(p.y-0.04)}],"run"); }
    if(call==="ISO"){ return setW(p,[{x:clamp(p.x+(p.x<.5?-.08:.08)),y:clamp(p.y+0.05)}],"run"); }
    return setW(p,[{x:clamp(p.x+(Math.random()-.5)*.08),y:clamp(p.y-0.06)},{x:clamp(p.x+(Math.random()-.5)*.12),y:clamp(p.y-0.14)}], wing?"pass":"run");
  });
  if(!ballId){ const cand=np.filter(p=>offIds.has(p.id)&&p.id!==handler.id&&ends[p.id]); ballId = cand.length? cand.reduce((a,p)=>ends[p.id].y<ends[a.id].y?p:a,cand[0]).id : handler.id; }
  const tEnd=ends[ballId]||{x:handler.x,y:handler.y};
  const passLike=/DEEP|PA|QUICK|BUBBLE|SCREEN|SWING|THREE|FLOPPY|POST|PNP/.test(call);
  const ball={ x:handler.x, y:handler.y, delay: passLike?0.5:0.16, ease:"out", route: ballToGoal? [tEnd,{x:goal.x,y:goal.y}] : [tEnd] };
  const deep = sport==="football" && tEnd.y < 0.34;
  const outcome = simOutcome(sport, call, deep);
  const withDef = np.map(p=>{
    if(offIds.has(p.id) || (sport==="football"&&p.label==="GK")) return p;
    if(p.team!=="def") return p;
    if(p.route && p.route.length) return p;
    const cx=p.x+(tEnd.x-p.x)*0.62, cy=p.y+(tEnd.y-p.y)*0.62;
    return {...p, route:[{x:clamp(cx),y:clamp(cy)}], routeType:"run", ease:"both", delay:0.16};
  });
  return { players:withDef, ball, info:{title, body:`${body} ${SCOREWORD[sport]||"Score!"}`, kind:"play", outcome} };
}
function BallGlyph({kind, cx, cy}){ const r=11;
  switch(kind){
    case "football": return <g><ellipse cx={cx} cy={cy} rx={r*1.15} ry={r*0.72} fill="#8a4a23" stroke="#fff" strokeWidth="1.5"/><line x1={cx-5} y1={cy} x2={cx+5} y2={cy} stroke="#fff" strokeWidth="1.5"/><line x1={cx-3} y1={cy-2.5} x2={cx-3} y2={cy+2.5} stroke="#fff" strokeWidth="1"/><line x1={cx} y1={cy-2.5} x2={cx} y2={cy+2.5} stroke="#fff" strokeWidth="1"/><line x1={cx+3} y1={cy-2.5} x2={cx+3} y2={cy+2.5} stroke="#fff" strokeWidth="1"/></g>;
    case "basketball": return <g><circle cx={cx} cy={cy} r={r} fill="#e07b39" stroke="#3a1f12" strokeWidth="1.5"/><line x1={cx-r} y1={cy} x2={cx+r} y2={cy} stroke="#3a1f12" strokeWidth="1.2"/><line x1={cx} y1={cy-r} x2={cx} y2={cy+r} stroke="#3a1f12" strokeWidth="1.2"/><path d={`M${cx-r} ${cy} Q${cx} ${cy-r*0.7} ${cx+r} ${cy}`} stroke="#3a1f12" strokeWidth="1" fill="none"/></g>;
    case "soccer": return <g><circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#222" strokeWidth="1.5"/><polygon points={`${cx},${cy-4} ${cx+4},${cy-1} ${cx+2.4},${cy+3.5} ${cx-2.4},${cy+3.5} ${cx-4},${cy-1}`} fill="#222"/></g>;
    case "volleyball": return <g><circle cx={cx} cy={cy} r={r} fill="#f4f4f4" stroke="#2b6cb0" strokeWidth="1.5"/><path d={`M${cx-r} ${cy-3} Q${cx} ${cy} ${cx+r} ${cy-4}`} stroke="#2b6cb0" strokeWidth="1" fill="none"/><path d={`M${cx-r+2} ${cy+4} Q${cx} ${cy} ${cx} ${cy-r}`} stroke="#2b6cb0" strokeWidth="1" fill="none"/></g>;
    case "puck": return <ellipse cx={cx} cy={cy} rx={r} ry={r*0.5} fill="#15171a" stroke="#fff" strokeWidth="1.5"/>;
    case "tennis": return <g><circle cx={cx} cy={cy} r={r} fill="#d6f24a" stroke="#9bbf1e" strokeWidth="1.5"/><path d={`M${cx-r} ${cy-2} Q${cx} ${cy+4} ${cx+r} ${cy-2}`} stroke="#fff" strokeWidth="1.3" fill="none"/></g>;
    case "baseball": return <g><circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#bbb" strokeWidth="1"/><path d={`M${cx-r+2} ${cy-r+3} Q${cx-2} ${cy} ${cx-r+2} ${cy+r-3}`} stroke="#c0392b" strokeWidth="1.2" fill="none"/><path d={`M${cx+r-2} ${cy-r+3} Q${cx+2} ${cy} ${cx+r-2} ${cy+r-3}`} stroke="#c0392b" strokeWidth="1.2" fill="none"/></g>;
    case "lacrosse": return <circle cx={cx} cy={cy} r={r*0.8} fill="#eef27a" stroke="#7c8a1f" strokeWidth="1.5"/>;
    default: return <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#222" strokeWidth="1.5"/>;
  }
}
const Token = React.memo(function Token({ p, vb, color, selected, onDown, at }) {
  const pos=at||p, cx=pos.x*vb[0], cy=pos.y*vb[1], arrow=color==="var(--def)"?"d":"o";
  const rt=p.routeType||"run", hasRoute=p.route.length>0;
  const dash = rt==="pass"?"11 7" : rt==="motion"?"3 6" : "none";
  let bar=null, endPt=null;
  if(hasRoute){ const pts=[{x:p.x,y:p.y},...p.route], last=pts[pts.length-1], prev=pts[pts.length-2]||{x:p.x,y:p.y}; endPt=last;
    if(rt==="block"){ const dx=last.x-prev.x, dy=last.y-prev.y, L=Math.hypot(dx,dy)||1, ux=-dy/L*0.02, uy=dx/L*0.02;
      bar={x1:(last.x-ux)*vb[0], y1:(last.y-uy)*vb[1], x2:(last.x+ux)*vb[0], y2:(last.y+uy)*vb[1]}; } }
  return <g>
    {hasRoute && <path d={rPath(p,p.route,vb)} fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={dash} markerEnd={rt==="block"?undefined:`url(#arrow-${arrow})`} opacity={at?.4:.9} strokeLinecap="round" strokeLinejoin="round"/>}
    {bar && <line x1={bar.x1} y1={bar.y1} x2={bar.x2} y2={bar.y2} stroke={color} strokeWidth="3.5" strokeLinecap="round" opacity={at?.4:.9}/>}
    {endPt && !at && rt!=="block" && <circle cx={endPt.x*vb[0]} cy={endPt.y*vb[1]} r="3" fill={color}/>}
    {selected && <circle cx={cx} cy={cy} r="21" fill="none" stroke="#fff" strokeWidth="2" opacity=".7"><animate attributeName="r" values="19;23;19" dur="1.4s" repeatCount="indefinite"/></circle>}
    <g onPointerDown={(e)=>onDown(e,p.id)} style={{cursor:"pointer"}}>
      <circle cx={cx} cy={cy} r="24" fill="transparent"/>
      <circle cx={cx} cy={cy} r="15" fill={color} stroke={selected?"#fff":"rgba(0,0,0,.35)"} strokeWidth={selected?3:2}/>
      <text x={cx} y={cy+4} fill="#0c0f0c" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="Barlow" style={{pointerEvents:"none"}}>{p.label}</text>
    </g></g>;
});

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&display=swap');
.pb-root{--bg:#0c1410;--panel:#13201a;--panel2:#18271f;--edge:#244033;--ink:#e8f0ea;--mut:#88a596;--acc:#36e08a;--off:#ffce4f;--def:#ff5a5a;font-family:'Barlow',sans-serif;color:var(--ink);background:radial-gradient(120% 120% at 50% 0%,#16241c,#0c1410 60%);min-height:100%;padding:18px;box-sizing:border-box;}
.pb-title{font-family:'Bebas Neue',sans-serif;letter-spacing:1px;line-height:.95;margin:0;}.pb-h1{font-size:42px;}.pb-h1 .x{color:var(--acc);}
.pb-wrap{max-width:1080px;margin:0 auto;}
.pb-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px;}
.pb-credits{font-size:12px;color:var(--mut);font-weight:600;}.pb-credits b{color:var(--acc);}
.pb-nav{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
.pb-nv{background:var(--panel);border:1px solid var(--edge);color:var(--mut);padding:8px 15px;border-radius:9px;font-weight:700;font-size:13px;cursor:pointer;transition:.15s;font-family:'Barlow';}
.pb-nv.on{background:var(--acc);color:#08160e;border-color:var(--acc);}
.pb-tabs{display:flex;gap:6px;flex-wrap:wrap;}
.pb-tab{background:var(--panel);border:1px solid var(--edge);color:var(--mut);padding:6px 11px;border-radius:8px;font-weight:600;font-size:12.5px;cursor:pointer;transition:.15s;}
.pb-tab.on{background:var(--acc);color:#08160e;border-color:var(--acc);}
.pb-grid{display:grid;grid-template-columns:1fr 300px;gap:16px;}@media(max-width:780px){.pb-grid{grid-template-columns:1fr;}}
.pb-board{background:var(--panel);border:1px solid var(--edge);border-radius:16px;padding:14px;}
.pb-seg{display:flex;gap:8px;margin-bottom:10px;}
.pb-play{display:flex;gap:6px;align-items:center;margin-bottom:10px;flex-wrap:wrap;}
.pb-plk{font-size:12px;color:var(--mut);font-weight:700;margin-right:2px;}
.pb-mb{flex:1;background:var(--panel2);border:1px solid var(--edge);color:var(--mut);padding:9px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;transition:.15s;}
.pb-mb.on{background:var(--acc);color:#08160e;border-color:var(--acc);}
.pb-mb.live{background:var(--off);color:#1a1405;border-color:var(--off);}
.pb-hintbar{background:var(--panel2);border:1px dashed var(--edge);border-radius:9px;padding:8px 12px;font-size:12.5px;color:var(--mut);margin-bottom:12px;text-align:center;}
.pb-svgwrap{display:flex;justify-content:center;}
.pb-side{display:flex;flex-direction:column;gap:12px;}
.pb-card{background:var(--panel);border:1px solid var(--edge);border-radius:14px;padding:14px;}
.pb-label{font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:1px;color:var(--mut);margin:0 0 9px;}
.pb-btn{width:100%;border:none;border-radius:10px;padding:11px;font-weight:700;font-size:13px;cursor:pointer;font-family:'Barlow';transition:.15s;display:flex;align-items:center;justify-content:center;gap:7px;}
.pb-btn:disabled{opacity:.5;cursor:not-allowed;}
.pb-off{background:var(--off);color:#1a1405;}.pb-def{background:var(--def);color:#fff;}.pb-acc{background:var(--acc);color:#08160e;}
.pb-ghost{background:var(--panel2);color:var(--ink);border:1px solid var(--edge);}
.pb-row{display:flex;gap:8px;}
.pb-input{width:100%;background:var(--panel2);border:1px solid var(--edge);color:var(--ink);border-radius:9px;padding:9px;font-family:'Barlow';font-size:13px;box-sizing:border-box;}
.pb-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px;}
.pb-chip{background:var(--panel2);border:1px solid var(--edge);color:var(--ink);border-radius:20px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;transition:.15s;}
.pb-chip:hover{border-color:var(--acc);color:var(--acc);}
.pb-chipd:hover{border-color:var(--def);color:var(--def);}
.pb-chip.pbsel{background:var(--acc);color:#06210f;border-color:var(--acc);}
.pb-wish{background:linear-gradient(160deg,rgba(54,224,138,.12),rgba(54,224,138,.02));border-color:rgba(54,224,138,.4);}
.pb-wish .pb-label{color:var(--acc);}
.pb-infocard{border-left:3px solid var(--acc);}
.pb-result{margin-top:10px;background:var(--panel2);border:1px solid var(--edge);border-left:3px solid var(--acc);border-radius:9px;padding:10px 12px;font-size:13px;line-height:1.45;}
.pb-result b{color:var(--acc);}.pb-result b.rdef{color:var(--def);}
.pb-info-t{font-family:'Bebas Neue';font-size:21px;letter-spacing:.5px;margin:0 0 6px;color:var(--acc);}.pb-info-t.def{color:var(--def);}
.pb-info-b{font-size:13.5px;line-height:1.5;}
.pb-sel{background:rgba(54,224,138,.1);border:1px solid var(--acc);color:var(--acc);font-size:12.5px;font-weight:600;padding:8px 10px;border-radius:9px;margin-bottom:8px;text-align:center;}
.pb-err{background:rgba(255,90,90,.12);border:1px solid var(--def);color:#ffc9c9;font-size:12.5px;line-height:1.45;padding:10px;border-radius:10px;}
.pb-hint{color:var(--mut);font-size:12px;line-height:1.45;}
.pb-spin{width:14px;height:14px;border:2px solid rgba(0,0,0,.3);border-top-color:currentColor;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.pb-legend{display:flex;gap:14px;font-size:12px;color:var(--mut);margin-top:10px;align-items:center;flex-wrap:wrap;}
.pb-editbar{margin-top:12px;border-top:1px solid var(--edge);padding-top:12px;}
.pb-dot{width:11px;height:11px;border-radius:50%;display:inline-block;margin-right:5px;vertical-align:middle;}
.pb-lib{max-height:172px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;margin-top:9px;}
.pb-libitem{display:flex;align-items:center;gap:8px;background:var(--panel2);border:1px solid var(--edge);border-radius:9px;padding:8px 10px;}
.pb-libname{flex:1;font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pb-libsport{font-size:10.5px;color:var(--mut);text-transform:uppercase;letter-spacing:.5px;}
.pb-mini{border:none;background:transparent;color:var(--acc);font-weight:700;cursor:pointer;font-size:12px;padding:2px 4px;}.pb-mini.x{color:var(--def);}
.pb-pbitem{display:flex;align-items:center;gap:8px;background:var(--panel2);border:1px solid var(--edge);border-radius:10px;padding:10px 12px;}
.pb-pbmeta{font-size:11.5px;color:var(--mut);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pb-link{background:none;border:none;color:var(--acc);font-weight:700;cursor:pointer;padding:0;font-size:inherit;text-decoration:underline;}
.pb-count{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--panel2);border:1px solid var(--edge);border-radius:9px;padding:7px 11px;margin-bottom:10px;font-size:13px;}
.pb-count b{color:var(--acc);font-size:15px;}
.pb-tier{background:var(--panel2);border:1px solid var(--edge);border-radius:11px;padding:13px;}
.pb-pm{display:flex;flex-direction:column;gap:0;}
.pb-pmhead{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;background:var(--panel2);border:1px solid var(--edge);border-radius:10px;padding:9px 12px;font-size:13px;margin-bottom:10px;}
.pb-pmhead b{color:var(--acc);font-size:15px;}
.pb-pmrow{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
.pb-hname{font-size:14px;font-weight:700;}
.pb-htip{font-size:12.5px;color:var(--mut);margin-top:3px;line-height:1.4;}
.pb-zonehint{font-size:12px;color:var(--mut);margin-bottom:8px;}
.pb-zonewrap{display:flex;justify-content:center;margin-bottom:10px;}
.pb-pmlog{background:var(--panel2);border:1px solid var(--edge);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.5;min-height:46px;}
.pb-logline{margin:1px 0;}
.pb-dpad{display:flex;flex-direction:column;align-items:center;gap:6px;margin:4px 0 6px;}
.pb-dpad .pb-btn{padding:8px 14px;min-width:46px;}
.pb-dpad-mid{display:flex;gap:6px;align-items:center;}
.pb-pen{background:var(--panel2);border:1px solid var(--edge);border-radius:10px;padding:9px 11px;margin-bottom:10px;}
.pb-penrow{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12.5px;}
.pb-pname{font-weight:600;}
.pb-pc{font-weight:700;font-size:12px;}
.pb-pc.warn{color:var(--off);} .pb-pc.bad{color:var(--def);}
.pb-mut{color:var(--mut);font-size:11.5px;}
.pb-bar{height:6px;border-radius:4px;background:rgba(255,255,255,.1);margin:6px 0;overflow:hidden;}
.pb-barfill{height:100%;border-radius:4px;transition:width .2s;}
.pb-card2{background:var(--panel2);border:1px solid var(--edge);border-radius:10px;padding:6px;}
.pb-lurow{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:8px;cursor:pointer;transition:.12s;}
.pb-lurow.sel{background:rgba(54,224,138,.14);outline:1px solid var(--acc);}
.pb-luord{flex:0 0 18px;font-weight:800;color:var(--mut);font-size:13px;}
.pb-lupos{flex:0 0 34px;font-size:11px;font-weight:700;color:var(--off);}
.pb-luname{flex:1;font-size:13px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pb-lubars{flex:0 0 64px;display:flex;flex-direction:column;gap:2px;}
.pb-lubar{height:4px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden;}
.pb-lubar>span{display:block;height:100%;border-radius:3px;}
.pb-suggitem{display:flex;gap:8px;align-items:flex-start;background:var(--panel2);border:1px solid var(--edge);border-radius:9px;padding:9px 11px;margin-bottom:6px;}
.pw-eyebrow{font-family:'Bebas Neue',sans-serif;letter-spacing:6px;font-size:15px;color:var(--off);margin-bottom:2px;}
.pw-univ{font-family:'Bebas Neue',sans-serif;letter-spacing:4px;font-size:18px;color:var(--off);text-align:center;margin-top:18px;opacity:.92;}
.pb-sharebar{background:linear-gradient(90deg,rgba(212,175,55,.16),rgba(70,160,90,.14));border:1px solid var(--off);border-radius:12px;padding:11px 13px;margin-bottom:12px;font-size:13px;color:var(--ink);}
.pb-sharelink{background:var(--panel2);border:1px solid var(--edge);border-radius:9px;padding:9px 11px;font-size:12px;color:var(--acc);word-break:break-all;font-family:ui-monospace,Menlo,monospace;}
.pb-outcome{margin-top:8px;padding:9px 12px;border-radius:10px;font-weight:800;font-size:14px;background:rgba(70,160,90,.16);border:1px solid var(--acc);color:var(--ink);}
.pb-outcome.def{background:rgba(214,70,70,.15);border-color:var(--def);}
.pb-sb{background:linear-gradient(#0f1620,#0a0f15);border:1px solid var(--edge);border-radius:13px;padding:9px 11px;margin-bottom:11px;box-shadow:inset 0 0 22px rgba(0,0,0,.4);}
.pb-sb-grid{display:flex;gap:7px;justify-content:flex-end;flex-wrap:wrap;align-items:flex-end;}
.pb-sb-cell{text-align:center;min-width:50px;}
.pb-sb-lab{font-size:8.5px;letter-spacing:1.4px;color:var(--mut);font-weight:800;}
.pb-sb-val{font-family:'Bebas Neue',ui-monospace,monospace;font-size:23px;color:#ffd24a;line-height:1.05;letter-spacing:1px;text-shadow:0 0 9px rgba(255,205,60,.35);}
.pb-sb-btns{display:flex;gap:4px;justify-content:center;margin-top:3px;}
.pb-sb-btns button,.pb-sb-score button{width:23px;height:21px;border-radius:6px;border:1px solid var(--edge);background:var(--panel2);color:var(--ink);font-weight:800;line-height:1;cursor:pointer;font-size:14px;}
.pb-sb-score{display:flex;align-items:center;gap:5px;justify-content:flex-end;margin-top:9px;border-top:1px solid var(--edge);padding-top:9px;}
.pb-sb-score b{font-family:'Bebas Neue',ui-monospace,monospace;font-size:27px;color:#ffd24a;min-width:28px;text-align:center;text-shadow:0 0 9px rgba(255,205,60,.35);}
.pb-sb-score span{font-size:9.5px;letter-spacing:1.4px;color:var(--mut);font-weight:800;}
.pb-sb-dash{color:var(--mut);font-size:16px!important;}
.pb-sittag{font-size:11px;color:var(--off);font-weight:700;}
.pb-diawrap{flex:0 0 120px;display:flex;justify-content:center;}
.pb-sittip{background:rgba(233,196,106,.12);border:1px solid rgba(233,196,106,.4);border-radius:9px;padding:8px 10px;margin-top:7px;font-size:12.5px;line-height:1.45;color:#f0e2b8;}
.pb-range{width:100%;accent-color:var(--acc);height:26px;}
.pb-fbfield{background:var(--panel2);border:1px solid var(--edge);border-radius:10px;padding:8px;margin-bottom:8px;}
.pb-fbgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;margin-bottom:8px;}
.pb-fbgrid .pb-hint{margin:0 0 4px;}
.pb-to{display:flex;align-items:center;gap:5px;}
.pb-todot{width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.15);display:inline-block;}
.pb-todot.on{background:var(--off);}
.pw-plans{margin-top:12px;display:flex;flex-direction:column;gap:8px;}
.pw-plan{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--panel2);border:1px solid var(--edge);border-radius:10px;padding:10px 12px;font-size:13px;}
.pw-plan .pb-mini{border:1px solid var(--acc);border-radius:8px;padding:5px 10px;}
.pb-tip{background:var(--panel2);border:1px solid var(--edge);border-left:3px solid var(--acc);border-radius:9px;padding:10px 12px;font-size:13px;line-height:1.45;margin-bottom:8px;}
.pb-discl{background:rgba(255,206,79,.1);border:1px solid var(--off);color:#ffe6a6;font-size:11.5px;line-height:1.45;padding:9px 11px;border-radius:9px;margin-bottom:12px;}
.pb-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:var(--acc);color:#08160e;font-weight:700;font-size:13px;padding:11px 18px;border-radius:30px;box-shadow:0 10px 30px rgba(0,0,0,.4);z-index:50;}
.pb-overlay{position:fixed;inset:0;background:rgba(6,12,9,.7);display:flex;align-items:center;justify-content:center;z-index:60;padding:18px;}
.pb-modal{background:var(--panel);border:1px solid var(--edge);border-radius:18px;padding:26px;max-width:380px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.5);}
.pw{max-width:520px;margin:5vh auto 0;text-align:center;}
.pw-logo{font-family:'Bebas Neue';font-size:64px;letter-spacing:2px;line-height:.9;}.pw-logo .x{color:var(--acc);}
.pw-tag{color:var(--mut);font-size:15px;margin:6px 0 26px;}
.pw-card{background:var(--panel);border:1px solid var(--edge);border-radius:20px;padding:30px 26px;text-align:left;box-shadow:0 24px 60px rgba(0,0,0,.4);}
.pw-price{font-family:'Bebas Neue';font-size:58px;line-height:1;color:var(--acc);}.pw-price small{font-family:'Barlow';font-size:16px;color:var(--mut);font-weight:600;}
.pw-feat{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;margin:10px 0;}
.pw-check{color:var(--acc);font-weight:800;}
.pw-fine{color:var(--mut);font-size:11.5px;text-align:center;margin-top:14px;line-height:1.5;}
.pw-trial{text-align:center;color:var(--acc);font-weight:700;font-size:13px;margin-top:4px;}
.pw-row2{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;}
.pw-check2{background:none;border:none;color:var(--ink);font:inherit;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px;padding:0;}
.pw-box{width:18px;height:18px;border:1.5px solid var(--edge);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:#06210f;}
.pw-box.on{background:var(--acc);border-color:var(--acc);}
.pw-signup{font-size:13px;color:var(--mut);}.pw-signup button{background:none;border:none;color:var(--acc);font:inherit;font-weight:700;cursor:pointer;padding:0;}
.pb-section{max-width:680px;margin:0 auto;}
`;

/* ============================================================ */
class ErrorBoundary extends React.Component{
  constructor(p){ super(p); this.state={err:false}; }
  static getDerivedStateFromError(){ return {err:true}; }
  componentDidCatch(){}
  render(){
    if(this.state.err) return (
      <div style={{minHeight:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#0c1410",color:"#e8f0ea",fontFamily:"sans-serif",padding:24,textAlign:"center"}}>
        <div><div style={{fontSize:40,marginBottom:8}}>🛠️</div>
          <div style={{fontWeight:700,marginBottom:6}}>That play hit a snag.</div>
          <div style={{opacity:.7,fontSize:14,marginBottom:16}}>Tap reload to keep going — your saved plays are safe.</div>
          <button onClick={()=>this.setState({err:false})} style={{background:"#36e08a",color:"#08160e",border:"none",borderRadius:10,padding:"10px 18px",fontWeight:700,cursor:"pointer"}}>Reload</button></div>
      </div>);
    return this.props.children;
  }
}

function PlaybookAIInner(){
  const [plan,setPlan]=useState("");
  const [trialStart,setTrialStart]=useState(0);
  const [trialUsed,setTrialUsed]=useState({}); const [sitFilter,setSitFilter]=useState("all");
  const [welcomed,setWelcomed]=useState(false);
  const [entered,setEntered]=useState(false);
  const [account,setAccount]=useState(null);
  const [authChecked,setAuthChecked]=useState(false);
  const [emailField,setEmailField]=useState("");
  const [nameField,setNameField]=useState("");
  const [authErr,setAuthErr]=useState("");
  const [authMode,setAuthMode]=useState("signup");
  const [agreed,setAgreed]=useState(false);
  const [remember,setRemember]=useState(true);
  const [view,setView]=useState("board");
  const [sport,setSport]=useState("football");
  const [side,setSide]=useState("offense");
  const [customName,setCustomName]=useState("");
  const [customCount,setCustomCount]=useState(6);
  const [players,setPlayers]=useState(()=>baseSet("football","offense"));
  const [defense,setDefense]=useState([]);
  const [sel,setSel]=useState([]);
  const [mode,setMode]=useState("move");
  const [lasso,setLasso]=useState(null);
  const [playing,setPlaying]=useState(false);
  const [t,setT]=useState(0);
  const [speed,setSpeed]=useState(1);
  const [loop,setLoop]=useState(false);
  const [ball,setBall]=useState(()=>freshBall("football"));
  const [info,setInfo]=useState(null);
  const [loading,setLoading]=useState("");
  const [error,setError]=useState("");
  const [history,setHistory]=useState([]);
  const [library,setLibrary]=useState([]);
  const [libName,setLibName]=useState("");
  const [books,setBooks]=useState([{id:"b-default",name:"My Playbook"}]);
  const [activeBook,setActiveBook]=useState("b-default");
  const [newBookName,setNewBookName]=useState("");
  const [newBookKind,setNewBookKind]=useState("personal");
  const [bookFilter,setBookFilter]=useState("all");
  const [bookEditing,setBookEditing]=useState(false);
  const [bookName2,setBookName2]=useState("");
  const [playEditId,setPlayEditId]=useState("");
  const [playName2,setPlayName2]=useState("");
  const [score,setScore]=useState("");
  const [formName,setFormName]=useState("");
  const [wishText,setWishText]=useState("");
  const [importCode,setImportCode]=useState("");
  const [shareOpen,setShareOpen]=useState(false),[sharePhone,setSharePhone]=useState(""),[shareLink,setShareLink]=useState(""),[preview,setPreview]=useState(false);
  const shareRef=useRef(null);
  const [shareTo,setShareTo]=useState(""),[autoPlay,setAutoPlay]=useState(false);
  const [simUsed,setSimUsed]=useState(0);
  const [simExtra,setSimExtra]=useState(0);
  const [showTokens,setShowTokens]=useState(false);
  const [pitchSel,setPitchSel]=useState(0);
  const [pitchMph,setPitchMph]=useState(96);
  const [pitching,setPitching]=useState(false);
  const [pp,setPp]=useState(0);
  const [pitchOut,setPitchOut]=useState("");
  const [batterSel,setBatterSel]=useState(0);
  const [batHand,setBatHand]=useState("R");
  const [locSel,setLocSel]=useState(4);
  const [hitBall,setHitBall]=useState(null);
  const [bp,setBp]=useState(0);
  const [balls,setBalls]=useState(0);
  const [strikes,setStrikes]=useState(0);
  const [outs,setOuts]=useState(0);
  const [showSpray,setShowSpray]=useState(false);
  const [pmOn,setPmOn]=useState(false);
  const [pmB,setPmB]=useState(0),[pmS,setPmS]=useState(0),[pmO,setPmO]=useState(0),[pmInn,setPmInn]=useState(1);
  const [pmRuns,setPmRuns]=useState(0),[pmHits,setPmHits]=useState(0),[pmK,setPmK]=useState(0),[pmBB,setPmBB]=useState(0);
  const [pmBatter,setPmBatter]=useState(0),[pmBases,setPmBases]=useState([null,null,null]);
  const [pmLog,setPmLog]=useState([]),[pmOver,setPmOver]=useState(false),[pmFinal,setPmFinal]=useState("");
  const [pmAim,setPmAim]=useState({r:2,c:2});
  const [pmHeatOn,setPmHeatOn]=useState(false);
  const [pmPlan,setPmPlan]=useState({});
  const [pmLineup,setPmLineup]=useState(()=>HITTERS_PM.map(h=>({...h})));
  const [pmEditOpen,setPmEditOpen]=useState(false);
  const [pmStaff]=useState(()=>PITCHERS_PM.map(p=>({...p})));
  const [pmPitcher,setPmPitcher]=useState(0),[pmPC,setPmPC]=useState(0),[pmUsed,setPmUsed]=useState([]),[pmBullpenOpen,setPmBullpenOpen]=useState(false);
  const [batOn,setBatOn]=useState(false);
  const [batLineup,setBatLineup]=useState(()=>BAT_LINEUP.map(b=>({...b})));
  const [batBench,setBatBench]=useState(()=>BAT_BENCH.map(b=>({...b})));
  const [batSpot,setBatSpot]=useState(0),[batEditOpen,setBatEditOpen]=useState(false),[batName,setBatName]=useState("");
  const [batView,setBatView]=useState("card");
  const [oppP,setOppP]=useState({name:"Opp Pitcher", hand:"R", velo:88, pitches:["4-Seam Fastball","Slider","Changeup"]});
  const [oppEdit,setOppEdit]=useState(false);
  const [bgInn,setBgInn]=useState(1),[bgO,setBgO]=useState(0),[bgB,setBgB]=useState(0),[bgS,setBgS]=useState(0),[bgRuns,setBgRuns]=useState(0),[bgHits,setBgHits]=useState(0);
  const [bgBatter,setBgBatter]=useState(0),[bgBases,setBgBases]=useState([null,null,null]),[bgLog,setBgLog]=useState([]),[bgOver,setBgOver]=useState(false),[bgFinal,setBgFinal]=useState("");
  const [bgAim,setBgAim]=useState({r:2,c:2}),[bgPitch,setBgPitch]=useState(0),[bgApproach,setBgApproach]=useState("aggressive");
  const [lineupCards,setLineupCards]=useState([]);
  const [suggInput,setSuggInput]=useState(""),[suggName,setSuggName]=useState(""),[suggs,setSuggs]=useState([]),[suggSent,setSuggSent]=useState(false);
  const [pmOpp,setPmOpp]=useState("");
  const [gamePlans,setGamePlans]=useState([]);
  const [pmPlanOpen,setPmPlanOpen]=useState(false);
  const [pmNotes,setPmNotes]=useState("");
  const [field,setField]=useState(null); const fraf=useRef(0);
  const [bbScreenOpen,setBbScreenOpen]=useState(false);
  const [aiPrompt,setAiPrompt]=useState("");
  const [tDoubles,setTDoubles]=useState(false);
  const [tStrat,setTStrat]=useState(0);
  const [tstate,setTstate]=useState(null);
  const [rallyOn,setRallyOn]=useState(false);
  const [toast,setToast]=useState("");
  const [crunch,setCrunch]=useState({time:"",sc:"",res:null});
  const [counter,setCounter]=useState({q:"",res:null});
  const [expert,setExpert]=useState({res:null});
  const svgRef=useRef(null), drag=useRef(null), lassoRef=useRef(null), raf=useRef(0), praf=useRef(0), draf=useRef(0);
  const [dia,setDia]=useState(null);
  const [fbStratOn,setFbStratOn]=useState(false);
  const [fbYard,setFbYard]=useState(25),[fbDown,setFbDown]=useState(1),[fbDist,setFbDist]=useState(10);
  const [fbQtr,setFbQtr]=useState(1),[fbClock,setFbClock]=useState(900),[fbTO,setFbTO]=useState(3),[fbOppTO,setFbOppTO]=useState(3);
  const [fbUs,setFbUs]=useState(0),[fbThem,setFbThem]=useState(0),[fbPlay,setFbPlay]=useState("");
  const [fbZoneOn,setFbZoneOn]=useState(false);
  const [bbStratOn,setBbStratOn]=useState(false);
  const [bbClock,setBbClock]=useState(600),[bbShot,setBbShot]=useState(24),[bbQtr,setBbQtr]=useState(1),[bbTO,setBbTO]=useState(4);
  const [bbUs,setBbUs]=useState(0),[bbThem,setBbThem]=useState(0),[bbFoulThem,setBbFoulThem]=useState(0),[bbPlay,setBbPlay]=useState("");
  const [golfCourse,setGolfCourse]=useState(0),[golfHole,setGolfHole]=useState(1),[golfDist,setGolfDist]=useState(GOLF_COURSES[0].holes[0].y);
  const [golfStrokes,setGolfStrokes]=useState(0),[golfTotal,setGolfTotal]=useState(0),[golfToPar,setGolfToPar]=useState(0);
  const [golfClub,setGolfClub]=useState(0),[golfPower,setGolfPower]=useState(100),[golfLog,setGolfLog]=useState([]);
  const [golfHoled,setGolfHoled]=useState(false),[golfRoundDone,setGolfRoundDone]=useState(false);
  const [golfBall,setGolfBall]=useState(0),[golfFly,setGolfFly]=useState(null);
  const animateField=(ev)=>{ if(!["out","1b","2b","3b","hr"].includes(ev)) return; cancelAnimationFrame(fraf.current);
    const plan=planField(ev); setField({...plan,t:0}); const dur=1300; let start=performance.now();
    const step=(now)=>{ const tt=Math.min(1,(now-start)/dur); setField(f=>f?{...f,t:tt}:null); if(tt<1){ fraf.current=requestAnimationFrame(step); } else { setTimeout(()=>setField(null),700); } };
    fraf.current=requestAnimationFrame(step); };
  const animateBases=(moves,label)=>{ if(!moves||!moves.length){ return; } const maxTo=moves.reduce((a,m)=>Math.max(a,m.to-m.from),0);
    const dur=520+maxTo*180, t0=(typeof performance!=="undefined"?performance.now():Date.now());
    setDia({moves,t:0,label}); cancelAnimationFrame(draf.current);
    const step=()=>{ const now=(typeof performance!=="undefined"?performance.now():Date.now()); const tt=Math.min(1,(now-t0)/dur);
      setDia(d=>d?{...d,t:tt}:null); if(tt<1){ draf.current=requestAnimationFrame(step); } else { setTimeout(()=>setDia(null),350); } };
    draf.current=requestAnimationFrame(step); };
  const framesRef=useRef([]), traf=useRef(0), playersRef=useRef(players);
  const graf=useRef(0);
  const [outcome,setOutcome]=useState(null); const outRef=useRef(null);
  const [sb,setSb]=useState(()=>defaultSB("football"));
  const sbStep=(k,d,min,max,wrap)=> setSb(o=>{ let v=(o[k]||0)+d; if(wrap){ if(v>max)v=min; else if(v<min)v=max; } else v=Math.max(min,Math.min(max,v)); return {...o,[k]:v}; });
  const mmss=(s)=>`${Math.floor(s/60)}:${String(Math.max(0,Math.floor(s%60))).padStart(2,"0")}`;
  const sbFields=(s)=>{ const F=[]; const add=(lab,val,dec,inc)=>F.push({lab,val,dec,inc});
    if(s==="football"){ add("QTR",sb.q>4?"OT":sb.q,()=>sbStep("q",-1,1,5,true),()=>sbStep("q",1,1,5,true)); add("TIME",mmss(sb.clock),()=>sbStep("clock",-15,0,3600),()=>sbStep("clock",15,0,3600)); add("DOWN",ord(sb.down),()=>sbStep("down",-1,1,4,true),()=>sbStep("down",1,1,4,true)); add("TO GO",sb.dist,()=>sbStep("dist",-1,1,99),()=>sbStep("dist",1,1,99)); add("BALL ON",fbYardLabel(sb.yard),()=>sbStep("yard",-5,1,99),()=>sbStep("yard",5,1,99)); }
    else if(s==="basketball"){ add("QTR",sb.q,()=>sbStep("q",-1,1,4,true),()=>sbStep("q",1,1,4,true)); add("TIME",mmss(sb.clock),()=>sbStep("clock",-15,0,2880),()=>sbStep("clock",15,0,2880)); add("SHOT",sb.shot,()=>setSb(o=>({...o,shot:o.shot===24?14:o.shot===14?7:24})),()=>setSb(o=>({...o,shot:o.shot===7?14:o.shot===14?24:7}))); }
    else if(s==="soccer"){ add("HALF",sb.q>2?"ET":sb.q,()=>sbStep("q",-1,1,3,true),()=>sbStep("q",1,1,3,true)); add("TIME",mmss(sb.clock),()=>sbStep("clock",-30,0,5400),()=>sbStep("clock",30,0,5400)); }
    else if(s==="hockey"){ add("PER",sb.per>3?"OT":sb.per,()=>sbStep("per",-1,1,4,true),()=>sbStep("per",1,1,4,true)); add("TIME",mmss(sb.clock),()=>sbStep("clock",-15,0,1200),()=>sbStep("clock",15,0,1200)); }
    else if(s==="lacrosse"){ add("QTR",sb.q,()=>sbStep("q",-1,1,4,true),()=>sbStep("q",1,1,4,true)); add("TIME",mmss(sb.clock),()=>sbStep("clock",-15,0,900),()=>sbStep("clock",15,0,900)); }
    else if(s==="baseball"||s==="softball"){ add("INNING",`${sb.top?"▲":"▼"} ${sb.inn}`,()=>setSb(o=> o.top?{...o,top:false}:{...o,top:true,inn:Math.max(1,o.inn-1)}),()=>setSb(o=> o.top?{...o,top:false}:{...o,top:true,inn:Math.min(15,o.inn+1)})); add("OUTS",sb.outs,()=>sbStep("outs",-1,0,2,true),()=>sbStep("outs",1,0,2,true)); }
    else if(s==="volleyball"){ add("SET",sb.set,()=>sbStep("set",-1,1,5,true),()=>sbStep("set",1,1,5,true)); }
    else if(s==="tennis"){ add("SET",sb.set,()=>sbStep("set",-1,1,5,true),()=>sbStep("set",1,1,5,true)); }
    return F; };
  useEffect(()=>{ playersRef.current=players; },[players]);
  const cfg=SPORTS[sport], vb=cfg.vb;
  const sportName = sport==="custom" ? (customName||"your sport") : cfg.label;
  const presets = side==="defense" ? DEF_FORMATIONS[sport] : FORMATIONS[sport];
  const isSel=(id)=>sel.includes(id);
  const selPlayer = sel.length===1 ? players.find(p=>p.id===sel[0]) : null;
  const isPro = plan==="plus"||plan==="unlimited";
  const cap = PLAN_CAP[plan] ?? 30;
  const trialExpired = plan==="trial" && trialStart>0 && (Date.now()-trialStart > TRIAL_MS);
  const remaining = cap===Infinity ? Infinity : (trialExpired ? 0 : (cap + simExtra - simUsed));

  useEffect(()=>{ (async()=>{ const bk=await pGet(BOOKS_KEY); const bb=(bk&&bk.length)?bk:[{id:"b-default",name:"My Playbook"}]; setBooks(bb); setActiveBook(bb[0].id);
    const lib=await pGet(LIB_KEY); if(lib){ const mig=lib.map(p=>p.bookId?p:{...p,bookId:bb[0].id}); setLibrary(mig); if(mig.some((p,i)=>p!==lib[i])) pSet(LIB_KEY,mig); }
    const acc=await pGet(ACCT_KEY); if(acc) setAccount(acc);
    const ax=await pGet(ACCESS_KEY); if(ax){ setEntered(!!ax.entered); setPlan(ax.plan||""); setTrialStart(ax.trialStart||0); if(ax.welcomed) setWelcomed(true); }
    const tu=await pGet(TRIAL_KEY); if(tu && typeof tu==="object") setTrialUsed(tu);
    const gp=await pGet(GP_KEY); if(gp) setGamePlans(gp);
    const lc=await pGet(LINEUP_KEY); if(lc) setLineupCards(lc);
    const sg=await pGet(SUGG_KEY); if(sg) setSuggs(sg);
    try{ const h=(typeof window!=="undefined"&&window.location&&window.location.hash)||""; const m=h.match(/[#&]p=([^&]+)/); if(m){ if(loadShared(m[1])){ setPreview(true); setAutoPlay(true); } } }catch(e){}
    setAuthChecked(true);
    const s=await pGet(SIM_KEY); const mk=monthKey();
    if(s && s.m===mk){ setSimUsed(s.u||0); setSimExtra(s.e||0); } else { setSimUsed(0); setSimExtra(0); pSet(SIM_KEY,{m:mk,u:0,e:0}); } })(); },[]);
  useEffect(()=>()=>cancelAnimationFrame(raf.current),[]);
  useEffect(()=>{ if(!toast) return; const id=setTimeout(()=>setToast(""),2400); return ()=>clearTimeout(id); },[toast]);

  const chargeSim=()=>{ if(plan==="unlimited") return; const nu=simUsed+1; setSimUsed(nu); pSet(SIM_KEY,{m:monthKey(),u:nu,e:simExtra}); };
  const firstCue=()=>{ if(!welcomed){ setWelcomed(true); playFanfare(); } };
  const trialEmailUsed = !!(account && account.email && trialUsed[account.email]);
  const startTrial=()=>{ const em=account&&account.email; if(em && trialUsed[em]){ setShowTokens(true); setToast("Your free trial's already been used on this email — choose a plan to continue."); return; }
    const t=Date.now(); firstCue(); setPlan("trial"); setTrialStart(t); setEntered(true);
    if(em){ const tu={...trialUsed,[em]:t}; setTrialUsed(tu); pSet(TRIAL_KEY,tu); }
    pSet(ACCESS_KEY,{entered:true,plan:"trial",trialStart:t,welcomed:true}); };
  const sitMatch=(p,key)=>{ if(key==="all") return true; const b=p.sit; if(!b) return false;
    switch(key){
      case "redzone": return p.sport==="football" && b.yard>=80;
      case "third": return p.sport==="football" && b.down===3 && b.dist>=7;
      case "fourth": return p.sport==="football" && b.down===4;
      case "twomin": return b.clock>0 && b.clock<=120;
      case "close": return Math.abs((b.home||0)-(b.away||0))<=8 && b.clock>0 && b.clock<=300;
      default: return true; } };
  const choosePlan=(pl)=>{ firstCue(); setPlan(pl); setEntered(true); pSet(ACCESS_KEY,{entered:true,plan:pl,trialStart:trialStart||Date.now(),welcomed:true}); setShowTokens(false); setToast(pl==="unlimited"?"Unlimited unlocked — you're all set":"You're on Plus — 100 simulations a month"); };
  const submitAuth=()=>{ const em=emailField.trim().toLowerCase(); const nm=nameField.trim();
    if(authMode==="signup" && nm.length<2){ setAuthErr("Please enter your name."); return; }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){ setAuthErr("Please enter a valid email address."); return; }
    if(authMode==="signup" && !agreed){ setAuthErr("Please agree to the Terms and Privacy Policy to continue."); return; }
    const acc={email:em,name:nm,at:Date.now(),agreedAt:Date.now(),termsVersion:"1.0"}; setAccount(acc); if(remember) pSet(ACCT_KEY,acc); else pSet(ACCT_KEY,null); };
  const signOut=()=>{ setAccount(null); setPlan(""); setTrialStart(0); setEntered(false); pSet(ACCT_KEY,null); pSet(ACCESS_KEY,null); setEmailField(""); setNameField(""); };

  const snapshot=()=>setHistory(h=>[...h.slice(-24),{players:clone(players),defense:clone(defense),ball:ball?{...ball,route:(ball.route||[]).map(r=>({...r}))}:null}]);
  const undo=()=>setHistory(h=>{ if(!h.length)return h; const p=h[h.length-1]; setPlayers(p.players); setDefense(p.defense); if(p.ball!==undefined) setBall(p.ball); setSel([]); return h.slice(0,-1); });
  const buildBoth=(s)=>{
    if(s==="volleyball"){ return makeFrom(VB_FULL); }
    if(s==="baseball"||s==="softball"){ return makeFrom(DEFAULTS[s]).map(p=>({...p,team:"def"})); }
    if(DEF_SPORTS.has(s)){
      const off=(s==="custom"?makeCustom(customCount):baseSet(s,"offense")).map(p=>({...p,team:"off"}));
      return [...off, ...alignDefense(s, off)]; }
    const off=(s==="custom"?makeCustom(customCount):baseSet(s,"offense")).map(p=>({...p,team:"off"}));
    const mirror=(DEFAULTS[s]||[]).map(p=>[p[0],p[1],clamp(1-p[2])]);
    const def=makeFrom(DEF_DEFAULTS[s]||mirror).map(p=>({...p,team:"def"}));
    return [...off, ...def]; };
  const switchSport=(s)=>{ cancelAnimationFrame(traf.current); setRallyOn(false); setTstate(s==="tennis"?tennisReady(tDoubles, side==="defense"):null); setSport(s); setPlayers(side==="both"?buildBoth(s):(s==="custom"?makeCustom(customCount):baseSet(s,side))); setDefense([]); setSel([]); setInfo(null); setError(""); setHistory([]); setLasso(null); setBall(freshBall(s)); setPitching(false); setPp(0); setHitBall(null); setBp(0); setPitchOut(""); setPitchSel(0); setBalls(0); setStrikes(0); setOuts(0); setPmOn(false); setBatOn(false); setFbStratOn(false); setBbStratOn(false); setSb(defaultSB(s)); cancelAnimationFrame(graf.current); if(s==="golf"){ setGolfHole(1); setGolfTotal(0); setGolfToPar(0); setGolfLog([]); setGolfRoundDone(false); setGolfHoled(false); setGolfStrokes(0); setGolfDist(GOLF_COURSES[golfCourse].holes[0].y); setGolfBall(0); setGolfFly(null); setGolfClub(0); setGolfPower(100); } setPitchMph(Math.round((pSpeed(PITCHES[0],s)[0]+pSpeed(PITCHES[0],s)[1])/2)); };
  const runGenerated=(out)=>{ cancelAnimationFrame(raf.current); cancelAnimationFrame(traf.current); snapshot(); setPlayers(out.players); if(out.players.some(p=>p.team==="def")) setSide("both"); if(out.ball) setBall(out.ball); setInfo(out.info); setSel([]); setHitBall(null); setDia(null); chargeSim();
    setOutcome(null); outRef.current=(out.info&&out.info.outcome)||null;
    setPlaying(true); setT(0); const dur=2600/speed; let start=performance.now();
    const step=(now)=>{ const tt=(now-start)/dur; if(tt<1){ setT(tt); raf.current=requestAnimationFrame(step); } else if(loop){ start=now; setT(0); raf.current=requestAnimationFrame(step); } else { setPlaying(false); setT(0); if(outRef.current) setOutcome(outRef.current); } };
    raf.current=requestAnimationFrame(step); };
  const fbAutoCall=()=>{ const yard=fbYard,down=fbDown,dist=fbYard+fbDist>=100?(100-fbYard):fbDist,diff=fbUs-fbThem,clock=fbClock,qtr=fbQtr; let ch;
    if(down===4){ ch = (dist<=2||yard>=62)?["Power run","QB run","Quick pass"] : (yard<55?["Punt"]:["Field goal","Punt"]); }
    else if(yard>=85) ch=["Power run","Play-action","Quick pass"];
    else if((qtr===2||qtr===4)&&clock<=120&&diff<0) ch=["Quick pass","Deep shot","Bubble screen"];
    else if(down===3) ch = dist>=8?["Deep shot","Quick pass","Screen"]:(dist<=2?["Power run","Play-action","QB run"]:["Quick pass","Play-action","Bubble screen"]);
    else if(down===1) ch=["Inside run","Play-action","Bubble screen","Deep shot"];
    else ch = dist>=8?["Deep shot","Quick pass","Screen"]:["Inside run","Play-action","Quick pass","Swing pass"];
    const k=ch[Math.floor(Math.random()*ch.length)]; fbLoadPlay(FB_PLAYS.find(p=>p.k===k)||FB_PLAYS[0]); };
  const bbAutoCall=()=>{ const diff=bbUs-bbThem,clock=bbClock,shot=bbShot,qtr=bbQtr; let ch;
    if(qtr>=4&&clock<=24&&diff<0&&diff>=-3) ch=["Quick 3","Pick & Roll"];
    else if(shot<=7) ch=["Iso","Pick & Roll"];
    else if(diff<0) ch=["Pick & Roll","Drive & kick","Iso"];
    else ch=["Pick & Roll","Horns","Drive & kick","Post-up"];
    const k=ch[Math.floor(Math.random()*ch.length)]; bbLoadPlay(BB_PLAYS.find(p=>p.k===k)||BB_PLAYS[0]); };
  const ord=(d)=>d===1?"st":d===2?"nd":d===3?"rd":"th";
  const fbLoadPlay=(p)=>{ setFbPlay(p.k); if(remaining<=0){ setShowTokens(true); return; } const dist=fbYard+fbDist>=100?(100-fbYard):fbDist;
    if(p.gen && p.f){ const out=genSituational("football", makeFrom(FORMATIONS.football[p.f]), p.gen, `${p.k} — ${fbYardLabel(fbYard)}`, `${fbDown}${ord(fbDown)} & ${dist}.`); setSide("offense"); setFbStratOn(false); runGenerated(out); }
    else if(p.f){ setSide("offense"); applyPreset(FORMATIONS.football[p.f], `${p.k} — ${fbYardLabel(fbYard)}, ${fbDown}${ord(fbDown)} & ${dist}`); setFbStratOn(false); }
    else { setInfo({title:`${p.k} — special teams`, body: p.k==="Field goal"?`A ${100-fbYard+17}-yard field goal attempt from ${fbYardLabel(fbYard)}.`:`Special-teams call from ${fbYardLabel(fbYard)}.`, kind:"play"}); setFbStratOn(false); } };
  const runBBScreen=(call,title,body)=>{ if(guardEdit()) return; if(remaining<=0){ setShowTokens(true); return; } const off=players.filter(p=>p.team!=="def").map(p=>({...p,team:"off"})); if(!off.length) return; const out=genSituational("basketball", off, call, title, body); setSide("both"); runGenerated(out); };
  const aiPlaceholder = sport==="basketball" ? "e.g. Spain pick and roll for my guard, shooter in the corner"
    : sport==="football" ? "e.g. Play-action, tight end deep corner, running back to the flat"
    : "Describe the play you want to run…";
  const runDescribed=()=>{ if(guardEdit()) return; if(remaining<=0){ setShowTokens(true); return; } if(!aiPrompt.trim()){ setToast("Describe your play first"); return; } const out=describePlay(sport, players, aiPrompt); runGenerated(out); };
  const bbLoadPlay=(p)=>{ setBbPlay(p.k); if(remaining<=0){ setShowTokens(true); return; }
    if(p.gen && p.f){ const out=genSituational("basketball", makeFrom(FORMATIONS.basketball[p.f]), p.gen, p.k, `${bbStratRead({clock:bbClock,shot:bbShot,qtr:bbQtr,diff:bbUs-bbThem,to:bbTO,foulThem:bbFoulThem}).split("—")[0].trim()}.`); setSide("offense"); setBbStratOn(false); runGenerated(out); }
    else if(p.f){ setSide("offense"); applyPreset(FORMATIONS.basketball[p.f], p.k); setBbStratOn(false); } };
  const switchSide=(sd)=>{ cancelAnimationFrame(traf.current); setRallyOn(false); setTStrat(0); setSide(sd); setSel([]); setInfo(null); setOutcome(null); setHistory([]); setDefense([]);
    if(sd==="both"){ setPlayers(buildBoth(sport));
      setInfo({title:"Offense vs Defense",body:"Both sides are on the field — green is the offense, red is the defense. Tap any player to move or route it, then Run play to watch both sides go at once.",kind:"play"}); }
    else if(sport!=="custom"){ setPlayers(baseSet(sport,sd)); } };
  const resetPlay=()=>{ setPlayers(side==="both"?buildBoth(sport):(sport==="custom"?makeCustom(customCount):baseSet(sport,side))); setDefense([]); setSel([]); setInfo(null); setOutcome(null); setError(""); setHistory([]); setLasso(null); setBall(freshBall(sport)); };

  const stopPlay=()=>{ cancelAnimationFrame(raf.current); setPlaying(false); setT(0); };
  const runPlay=()=>{ if(playing){ stopPlay(); return; } setPlaying(true); setT(0); setOutcome(null); outRef.current=(info&&info.outcome)||null; const dur=2600/speed; let start=performance.now();
    const step=(now)=>{ const tt=(now-start)/dur;
      if(tt<1){ setT(tt); raf.current=requestAnimationFrame(step); }
      else if(loop){ start=now; setT(0); raf.current=requestAnimationFrame(step); }
      else { setPlaying(false); setT(0); if(outRef.current) setOutcome(outRef.current); } };
    raf.current=requestAnimationFrame(step); };
  useEffect(()=>{ if(!autoPlay || !players.length || playing) return; const id=setTimeout(()=>{ try{ runPlay(); }catch(e){} setAutoPlay(false); }, 700); return ()=>clearTimeout(id); },[autoPlay, players.length]);
  const setRouteType=(rt)=>{ if(!sel.length) return; setPlayers(ps=>ps.map(p=>sel.includes(p.id)?{...p,routeType:rt}:p)); };
  const flipPlay=()=>{ snapshot(); setPlayers(ps=>ps.map(p=>({...p, x:1-p.x, route:(p.route||[]).map(r=>({...r,x:1-r.x}))}))); };
  const generatePlay=()=>{ if(playing||rallyOn||pitching) return; if(guardEdit()) return;
    if(sport==="tennis"){ tennisPlay(true); return; }
    if(isDiamond){ if(remaining<=0){ setShowTokens(true); return; } throwPitch(); return; }
    if(remaining<=0){ setShowTokens(true); return; }
    snapshot(); const out=genTeamPlay(sport, players);
    setPlayers(out.players); if(out.players.some(p=>p.team==="def")) setSide("both"); if(BALLS[sport]) setBall(out.ball); setInfo(out.info); setSel([]); chargeSim();
    setOutcome(null); outRef.current=(out.info&&out.info.outcome)||null;
    setPlaying(true); setT(0); const dur=2600/speed; let start=performance.now();
    const step=(now)=>{ const tt=(now-start)/dur; if(tt<1){ setT(tt); raf.current=requestAnimationFrame(step); } else if(loop){ start=now; setT(0); raf.current=requestAnimationFrame(step); } else { setPlaying(false); setT(0); if(outRef.current) setOutcome(outRef.current); } };
    raf.current=requestAnimationFrame(step); };
  const selectPitch=(i)=>{ const r=pSpeed(PITCHES[i],sport); setPitchSel(i); setPitchMph(Math.round((r[0]+r[1])/2)); setPp(0); setPitchOut(""); setHitBall(null); };
  const setDefenseFor=(bi)=>{ const b=BATTERS[bi]; snapshot(); const map=shiftFor(sport,batHand,b);
    setPlayers(ps=>ps.map(p=> map[p.label] && p.label!=="P" && p.label!=="C" ? {...p,x:map[p.label].x,y:map[p.label].y,route:[]} : p));
    setInfo({title:`Defense set vs ${batHand==="R"?"RHH":"LHH"} ${b.k}`, body:`Fielders positioned for a ${batHand==="R"?"right":"left"}-handed ${b.k.toLowerCase()} hitter. ${b.desc}`, kind:"play"}); };
  const finishAB=(r,batter,p,loc)=>{ setPitching(false); setPitchOut(r); setInfo({title:`${batHand==="R"?"RHH":"LHH"} ${batter.k} vs ${p.k}`, body:`${p.k} ${loc.toLowerCase()} at ${pitchMph} mph. ► ${r}`, kind:"play"}); };
  const resolveHit=(bb,batter,p,loc)=>{ const fs=playersRef.current.filter(f=>f.label!=="C"); let near=null,dmin=9;
    for(const f of fs){ const d=Math.hypot(f.x-bb.x,f.y-bb.y); if(d<dmin){dmin=d;near=f;} }
    const fly=/fly|line|pop/.test(bb.type), homer=bb.q>0.84 && /fly|line/.test(bb.type) && bb.y<0.18, where=fieldName(bb.x);
    const wasOut = !homer && dmin<(fly?0.13:0.095);
    let r; if(homer) r=`${dirWord(batHand,bb.x)} ${bb.type} — crushed to ${where}. HOME RUN!`;
    else if(wasOut) r=`${dirWord(batHand,bb.x)} ${bb.type} — ${near?near.label:"the fielder"} is right there. OUT!`;
    else { const hit = bb.y<0.3 ? (dmin>0.22?"a double into the gap":"a clean base hit") : "an infield single"; r=`${dirWord(batHand,bb.x)} ${bb.type} to ${where} — ${hit}! The defense couldn't get to it.`; }
    setBalls(0); setStrikes(0);
    if(wasOut){ const o=outs+1; setOuts(o>=3?0:o); r += o>=3?" (3 outs — inning over)":` (${o} out${o>1?"s":""})`; }
    finishAB(r,batter,p,loc); };
  const pmReset=()=>{ setPmB(0);setPmS(0);setPmO(0);setPmInn(1);setPmRuns(0);setPmHits(0);setPmK(0);setPmBB(0);setPmBatter(0);setPmBases([null,null,null]);setPmLog([]);setPmOver(false);setPmFinal("");setPmAim({r:2,c:2});setPmPitcher(0);setPmPC(0);setPmUsed([]); };
  const bringIn=(idx)=>{ const p=pmStaff[idx]; setPmUsed(u=>u.indexOf(pmPitcher)<0?[...u,pmPitcher]:u); setPmPitcher(idx); setPmPC(0); setPmBullpenOpen(false);
    setPmLog(l=>[`▸ Pitching change — ${p.name} (${p.hand}HP, ${p.role}) takes the ball.`,...l].slice(0,6)); setToast(`${p.name} is in`); };
  const aimToCi=(a)=> (a.r>=1&&a.r<=3&&a.c>=1&&a.c<=3) ? {inZone:true,zcol:a.c-1,zrow:a.r-1} : {inZone:false,edge:a.c===0?"in":a.c===4?"out":a.r===0?"high":"low"};
  const pmNudge=(dr,dc)=> setPmAim(a=>({r:Math.max(0,Math.min(4,a.r+dr)), c:Math.max(0,Math.min(4,a.c+dc))}));
  const pmThrowAim=()=>{ pmThrow(aimToCi(pmAim)); setPmAim({r:2,c:2}); };
  const planLabel=(e)=>{ const ci=aimToCi({r:e.r,c:e.c}); return `${PITCHES[e.pitch].k} ${ci.inZone?pmZoneWord(ci.zcol,ci.zrow):pmEdgeWord(ci.edge)}`; };
  const addToPlan=()=>{ const bi=pmBatter%pmLineup.length; setPmPlan(pl=>({...pl,[bi]:[...(pl[bi]||[]),{pitch:pitchSel,r:pmAim.r,c:pmAim.c,mph:pitchMph}]})); setToast(`Added to plan vs ${pmLineup[bi].name}`); };
  const tipFor=(h)=> h.tip || `Strong ${h.loves}, weak ${h.hates} — pitch him away from his hot zone.`;
  const updateHitter=(idx,field,val)=> setPmLineup(L=>L.map((h,i)=> i===idx?{...h,[field]:val,tip:undefined}:h));
  const updateHitterVals=(idx,obj)=> setPmLineup(L=>L.map((h,i)=> i===idx?{...h,...obj,tip:undefined}:h));
  const removeFromPlan=(i)=>{ const bi=pmBatter%HITTERS_PM.length; setPmPlan(pl=>({...pl,[bi]:(pl[bi]||[]).filter((_,j)=>j!==i)})); };
  const clearHitterPlan=()=>{ const bi=pmBatter%HITTERS_PM.length; setPmPlan(pl=>({...pl,[bi]:[]})); };
  const saveGamePlan=()=>{ const nm=pmOpp.trim(); if(!nm){ setToast("Name the opponent first"); return; }
    const hasPitches=Object.values(pmPlan).some(a=>a&&a.length);
    if(!hasPitches && !pmNotes.trim()){ setToast("Add a planned pitch or some notes first"); return; }
    const entry={ id:`G-${Date.now()}`, opponent:nm, plan:pmPlan, notes:pmNotes.trim(), lineup:pmLineup, sport, createdAt:Date.now() };
    const next=[entry,...gamePlans.filter(g=>g.opponent.toLowerCase()!==nm.toLowerCase())]; setGamePlans(next); pSet(GP_KEY,next); setToast(`Game plan vs ${nm} saved`); };
  const loadGamePlan=(g)=>{ setPmPlan(g.plan||{}); setPmNotes(g.notes||""); if(g.lineup&&g.lineup.length) setPmLineup(g.lineup.map(h=>({...h}))); setPmOpp(g.opponent); setPmBatter(0); setPmPlanOpen(true); setToast(`Loaded plan vs ${g.opponent}`); };
  const deleteGamePlan=(id)=>{ const next=gamePlans.filter(g=>g.id!==id); setGamePlans(next); pSet(GP_KEY,next); };
  const updateBatter=(idx,field,val)=> setBatLineup(L=>L.map((b,i)=> i===idx?{...b,[field]:val}:b));
  const pinchHit=(benchIdx)=>{ setBatLineup(L=>{ const nl=[...L]; const inc=batBench[benchIdx]; const out=nl[batSpot]; nl[batSpot]={...inc, pos: out.pos}; setBatBench(B=>B.map((b,i)=> i===benchIdx?{...out, pos:b.pos==="C"?"C":(out.pos)}:b)); return nl; }); setToast(`${batBench[benchIdx].name} pinch hits for spot ${batSpot+1}`); };
  const saveLineupCard=()=>{ const nm=batName.trim(); if(!nm){ setToast("Name your lineup card"); return; }
    const entry={ id:`L-${Date.now()}`, name:nm, lineup:batLineup, bench:batBench, sport, createdAt:Date.now() };
    const next=[entry,...lineupCards.filter(l=>l.name.toLowerCase()!==nm.toLowerCase())]; setLineupCards(next); pSet(LINEUP_KEY,next); setToast(`Lineup "${nm}" saved`); };
  const loadLineupCard=(l)=>{ setBatLineup(l.lineup.map(b=>({...b}))); if(l.bench) setBatBench(l.bench.map(b=>({...b}))); setBatName(l.name); setBatSpot(0); setToast(`Loaded "${l.name}"`); };
  const deleteLineupCard=(id)=>{ const next=lineupCards.filter(l=>l.id!==id); setLineupCards(next); pSet(LINEUP_KEY,next); };
  const toggleArsenal=(k)=> setOppP(p=>({...p, pitches: p.pitches.indexOf(k)>=0 ? (p.pitches.length>1?p.pitches.filter(x=>x!==k):p.pitches) : [...p.pitches,k]}));
  const bgReset=()=>{ setBgInn(1);setBgO(0);setBgB(0);setBgS(0);setBgRuns(0);setBgHits(0);setBgBatter(0);setBgBases([null,null,null]);setBgLog([]);setBgOver(false);setBgFinal("");setBgAim({r:2,c:2}); };
  const bgSim=()=>{ if(bgOver||dia) return; if(remaining<=0){ setShowTokens(true); return; } chargeSim();
    const b=batLineup[bgBatter%batLineup.length], a=bgAim, ci=(a.r>=1&&a.r<=3&&a.c>=1&&a.c<=3)?{inZone:true,zcol:a.c-1,zrow:a.r-1}:{inZone:false,edge:a.c===0?"in":a.c===4?"out":a.r===0?"high":"low"};
    const pName=oppP.pitches[bgPitch%oppP.pitches.length], pitch=PITCHES.find(p=>p.k===pName)||PITCHES[0];
    const res=batterVsPitch(b, oppP, pitch, ci, bgApproach);
    let bb=bgB,s=bgS,o=bgO,inn=bgInn,runs=bgRuns,hits=bgHits,bases=bgBases.slice(),next=false,extra="",advancing=null;
    const runner={name:b.name, spd:b.speed!=null?b.speed:.5};
    switch(res.ev){
      case "ball": bb++; if(bb>=4){ advancing="bb"; extra=" Ball four — walk."; next=true; } break;
      case "looK": case "swK": s++; if(s>=3){ o++; extra=" Strike three."; next=true; } break;
      case "foul": if(s<2) s++; break;
      case "out": o++; next=true; break;
      case "1b": case "2b": case "3b": case "hr": hits++; advancing=res.ev; next=true; break;
    }
    let txt=res.txt+extra, mv=null, label="";
    if(advancing){ const r=bbMoves(advancing, bases, runner); bases=r.bases; runs+=r.runs; mv=r.moves; label=r.label; }
    if(o>=3){ o=0; bases=[null,null,null]; inn++; bb=0; s=0; next=true; txt+=`  ▸ Three down — end of inning ${inn-1}.`; }
    let over=false, final="";
    if(inn>9){ over=true; final=`Your lineup scored ${runs} run${runs===1?"":"s"} on ${hits} hit${hits===1?"":"s"} off ${oppP.name} (${oppP.hand}HP, ${oppP.velo}). ${runs>=6?"You lit him up! 🔥":runs>=3?"Solid offensive day.":"He kept you quiet — tweak your approach and run it back."}`; }
    setBgB(next?0:bb); setBgS(next?0:s); setBgO(o); setBgInn(Math.min(inn,9)); setBgRuns(runs); setBgHits(hits); setBgBases(bases);
    if(next) setBgBatter(x=>(x+1)%batLineup.length);
    setBgLog(l=>[txt,...l].slice(0,6)); setBgAim({r:2,c:2});
    if(mv) animateBases(mv,label);
    if(over){ setBgOver(true); setBgFinal(final); } };
  const bgEmptyBases=()=>{ setBgBases([null,null,null]); setDia(null); };
  const bgToggleBase=(i)=>{ if(dia)return; setBgBases(bs=>{ const n=bs.slice(); n[i]=n[i]?null:{name:"Runner",spd:.6}; return n; }); };
  const bgNudge=(dr,dc)=> setBgAim(a=>({r:Math.max(0,Math.min(4,a.r+dr)), c:Math.max(0,Math.min(4,a.c+dc))}));
  const renderDiamond=(bases,outs,bside,onBase)=>{ const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    const col=r=> r&&r.spd>=.7?"var(--off)":"var(--acc)";
    return (<div className="pb-diawrap">
      <svg viewBox="0 0 120 134" style={{width:"100%",maxWidth:230}}>
        <polygon points="60,110 106,64 60,18 14,64" fill="rgba(54,224,138,.06)" stroke="rgba(255,255,255,.18)" strokeWidth="1.5"/>
        {[[1,106,64],[2,60,18],[3,14,64]].map(([bi,x,y])=>(
          <rect key={bi} x={x-6} y={y-6} width="12" height="12" transform={`rotate(45 ${x} ${y})`} fill={!dia&&bases[bi-1]?col(bases[bi-1]):"rgba(255,255,255,.08)"} stroke="#fff" strokeWidth="1.3" onClick={onBase?()=>onBase(bi-1):undefined} style={{cursor:onBase?"pointer":"default"}}/>))}
        <rect x="54" y="104" width="12" height="12" transform="rotate(45 60 110)" fill="#fff" opacity=".8"/>
        {!dia && bases.map((r,i)=> r? <circle key={i} cx={basePos(i+1)[0]} cy={basePos(i+1)[1]} r="5.6" fill={col(r)} stroke="#06210f" strokeWidth="1.5"/>:null)}
        {dia && dia.moves.map((m,i)=>{ const f=m.from+(m.to-m.from)*ease(dia.t); const p=basePos(Math.min(4,f)); const op=m.score?Math.max(0,1-dia.t*0.9):1;
          return <circle key={i} cx={p[0]} cy={p[1]} r="5.6" fill={col(m.runner)} stroke="#06210f" strokeWidth="1.5" opacity={op}/>; })}
        {bside==="defense" && Object.entries(FIELD_XY).map(([k,p])=>{ let pos=p; if(field&&field.fielderKey===k){ const c=Math.min(1,field.t/0.5); pos=[p[0]+(field.ballTo[0]-p[0])*c, p[1]+(field.ballTo[1]-p[1])*c]; } return <circle key={"f"+k} cx={pos[0]} cy={pos[1]} r="3.3" fill="var(--def)" stroke="#2a0e0e" strokeWidth="0.9"/>; })}
        {field && (()=>{ const c=Math.min(1,field.t/0.5); const bx=60+(field.ballTo[0]-60)*c, by=110+(field.ballTo[1]-110)*c; const throwing=field.throwTo&&field.t>0.5; const tc=throwing?(field.t-0.5)/0.5:0; const tx=field.throwTo?field.ballTo[0]+(field.throwTo[0]-field.ballTo[0])*tc:0, ty=field.throwTo?field.ballTo[1]+(field.throwTo[1]-field.ballTo[1])*tc:0;
          return <g>{throwing&&<line x1={field.ballTo[0]} y1={field.ballTo[1]} x2={tx} y2={ty} stroke="rgba(255,255,255,.5)" strokeWidth="1" strokeDasharray="2 2"/>}<circle cx={throwing?tx:bx} cy={throwing?ty:by} r="2.6" fill="#fff" stroke="#bbb" strokeWidth="0.6"/></g>; })()}
        {dia && dia.label && <text x="60" y="130" textAnchor="middle" fontFamily="Bebas Neue" fontSize="16" fill="var(--off)" letterSpacing="1">{dia.label}</text>}
        {!dia && <text x="60" y="130" textAnchor="middle" fontFamily="Barlow" fontSize="9" fill="var(--mut)">tap a base to set a runner</text>}
      </svg>
    </div>); };
  const sendSuggestion=()=>{ const t=suggInput.trim(); if(!t){ setToast("Write a suggestion first"); return; }
    const entry={ id:`S-${Date.now()}`, text:t, from:suggName.trim()||"Anonymous", at:Date.now() };
    const next=[entry,...suggs]; setSuggs(next); pSet(SUGG_KEY,next); setSuggInput(""); setSuggSent(true); };
  const pmThrow=(ci)=>{ if(pmOver||dia) return; if(remaining<=0){ setShowTokens(true); return; } chargeSim();
    const h=pmLineup[pmBatter%pmLineup.length], pitch=PITCHES[pitchSel];
    const P=pmStaff[pmPitcher], fatigue=Math.max(0,Math.min(1,(pmPC-P.stamina*0.8)/(P.stamina*0.4))), platoon=P.hand===h.hand?1:-1;
    const res=pmApplyMods(pitchVsHitter(h,pitch,ci), {fatigue, platoon, stuff:P.stuff});
    setPmPC(c=>c+1);
    let b=pmB,s=pmS,o=pmO,inn=pmInn,runs=pmRuns,hits=pmHits,k=pmK,bb=pmBB,bases=pmBases.slice(),next=false,extra="",advancing=null;
    const runner={name:h.name, spd:h.spd!=null?h.spd:.5};
    switch(res.ev){
      case "ball": b++; if(b>=4){ bb++; advancing="bb"; extra=" Ball four — walk."; next=true; } break;
      case "looK": case "swK": s++; if(s>=3){ k++; o++; extra=" Strike three!"; next=true; } break;
      case "foul": if(s<2) s++; break;
      case "out": o++; next=true; break;
      case "1b": case "2b": case "3b": case "hr": hits++; advancing=res.ev; next=true; break;
    }
    let txt=res.txt+extra, mv=null, label="";
    if(advancing){ const r=bbMoves(advancing, bases, runner); bases=r.bases; runs+=r.runs; mv=r.moves; label=r.label; }
    if(o>=3){ o=0; bases=[null,null,null]; inn++; b=0; s=0; next=true; txt+=`  ▸ Side retired — end of inning ${inn-1}.`; }
    let over=false, final="";
    if(inn>9){ over=true; const yours=Math.floor(Math.random()*6); final=`You allowed ${runs} run${runs===1?"":"s"} over 9 — ${k} K, ${hits} H, ${bb} BB. Your offense scored ${yours}. ${yours>runs?"You win the game! 🏆":yours<runs?"Heartbreaker — you take the loss.":"Dead even — it'd go to extras."}`; }
    setPmB(next?0:b); setPmS(next?0:s); setPmO(o); setPmInn(Math.min(inn,9)); setPmRuns(runs); setPmHits(hits); setPmK(k); setPmBB(bb); setPmBases(bases);
    if(next) setPmBatter(x=>(x+1)%HITTERS_PM.length);
    setPmLog(l=>[txt,...l].slice(0,6));
    animateField(res.ev);
    if(mv) animateBases(mv,label);
    if(over){ setPmOver(true); setPmFinal(final); } };
  const pmEmptyBases=()=>{ setPmBases([null,null,null]); setDia(null); };
  const pmToggleBase=(i)=>{ if(dia)return; setPmBases(bs=>{ const n=bs.slice(); n[i]=n[i]?null:{name:"Runner",spd:.6}; return n; }); };
  const buntPlay=(lineSide)=>{ if(pitching) return; if(remaining<=0){ setShowTokens(true); return; }
    const p=PITCHES[pitchSel], batter=BATTERS[batterSel], loc=PITCH_LOCS[locSel];
    chargeSim(); setPitching(true); setPitchOut(""); setHitBall(null); setPp(0); setBp(0);
    const dur=Math.max(620,1400-(pitchMph-55)*10), t0=performance.now();
    const pitchStep=(now)=>{ const tt=Math.min(1,(now-t0)/dur); setPp(tt);
      if(tt<1){ praf.current=requestAnimationFrame(pitchStep); return; }
      const x = lineSide==="3B" ? clamp(.22+Math.random()*.08) : clamp(.7+Math.random()*.08);
      const bb={x, y:clamp(.6+Math.random()*.06), type:"bunt", q:.2}; setHitBall(bb);
      const h0=performance.now();
      const hitStep=(n)=>{ const t2=Math.min(1,(n-h0)/820); setBp(t2); if(t2<1){ praf.current=requestAnimationFrame(hitStep); } else {
        const fs=playersRef.current.filter(f=>["P","C","1B","3B"].indexOf(f.label)>=0); let near=null,dmin=9;
        for(const f of fs){ const d=Math.hypot(f.x-bb.x,f.y-bb.y); if(d<dmin){dmin=d;near=f;} }
        setBalls(0); setStrikes(0);
        let r; if(dmin<0.17){ const o=outs+1; setOuts(o>=3?0:o); r=`Bunt down the ${lineSide} line — ${near?near.label:"the corner"} charges and throws him out!`+(o>=3?" (3 outs — inning over)":` (${o} out${o>1?"s":""})`); }
        else r=`Bunt down the ${lineSide} line — perfectly placed, beats it out for a base hit! Nobody could get there.`;
        finishAB(r,batter,p,loc); } };
      praf.current=requestAnimationFrame(hitStep); };
    praf.current=requestAnimationFrame(pitchStep); };
  const throwPitch=()=>{ if(pitching) return; if(remaining<=0){ setShowTokens(true); return; }
    const p=PITCHES[pitchSel], batter=BATTERS[batterSel], loc=PITCH_LOCS[locSel], breaking=/Curve|Slider|Fork|Change|Knuckle/.test(p.k);
    chargeSim(); setPitching(true); setPitchOut(""); setHitBall(null); setPp(0); setBp(0);
    const dur=Math.max(620,1400-(pitchMph-55)*10), t0=performance.now();
    const pitchStep=(now)=>{ const tt=Math.min(1,(now-t0)/dur); setPp(tt);
      if(tt<1){ praf.current=requestAnimationFrame(pitchStep); return; }
      const take=Math.random()<((loc==="Up"||loc==="Down")?0.2:0.07);
      if(take){ const inZone=!(loc==="Up"||loc==="Down")||Math.random()<.4;
        if(inZone){ const ns=strikes+1; if(ns>=3){ const o=outs+1; setStrikes(0); setBalls(0); setOuts(o>=3?0:o); finishAB(`${batter.k} takes strike three — caught looking. STRIKEOUT!${o>=3?" Inning over.":""}`,batter,p,loc); } else { setStrikes(ns); finishAB(`${batter.k} takes the ${loc.toLowerCase()} pitch — called strike. Count ${balls}-${ns}.`,batter,p,loc); } }
        else { const nb=balls+1; if(nb>=4){ setBalls(0); setStrikes(0); finishAB(`${batter.k} lays off — ball four. WALK!`,batter,p,loc); } else { setBalls(nb); finishAB(`${batter.k} lays off the ${loc.toLowerCase()} pitch — ball. Count ${nb}-${strikes}.`,batter,p,loc); } }
        return; }
      const whiff=Math.random()<(0.1+(breaking?0.08:0)+(loc==="Middle"?-0.05:0)+(1-batter.contact)*0.12);
      if(whiff){ const ns=strikes+1; if(ns>=3){ const o=outs+1; setStrikes(0); setBalls(0); setOuts(o>=3?0:o); finishAB(`${batter.k} swings through the ${p.k.toLowerCase()} — STRIKEOUT!${o>=3?" Inning over.":""}`,batter,p,loc); } else { setStrikes(ns); finishAB(`${batter.k} swings and misses — strike. Count ${balls}-${ns}.`,batter,p,loc); } return; }
      if(Math.random()<0.2){ let ns=strikes; if(strikes<2){ ns=strikes+1; setStrikes(ns); } finishAB(`${batter.k} fouls off the ${p.k.toLowerCase()} — stays alive. Count ${balls}-${ns}.`,batter,p,loc); return; }
      const bb=battedBall(batter,batHand,p,loc); setHitBall(bb);
      const h0=performance.now(), hdur=/fly|line|pop/.test(bb.type)?900:760;
      const hitStep=(n)=>{ const t2=Math.min(1,(n-h0)/hdur); setBp(t2); if(t2<1){ praf.current=requestAnimationFrame(hitStep); } else { resolveHit(bb,batter,p,loc); } };
      praf.current=requestAnimationFrame(hitStep); };
    praf.current=requestAnimationFrame(pitchStep); };

  useEffect(()=>{ if(sport==="tennis" && !rallyOn) setTstate(tennisReady(tDoubles, side==="defense")); }, [sport, side, tDoubles]);
  const tennisPlay=(rand)=>{ if(rallyOn) return; if(remaining<=0){ setShowTokens(true); return; }
    const serveTop = side==="defense";
    const list = serveTop?TENNIS_STRATS.defense:TENNIS_STRATS.offense;
    const si = rand===true ? Math.floor(Math.random()*list.length) : (tStrat%list.length);
    if(rand===true) setTStrat(si);
    const strat = list[si];
    const r = genRally({serveTop, doubles:tDoubles, stratKey:strat.k});
    framesRef.current=r.frames; setTstate(r.frames[0]); setRallyOn(true); chargeSim();
    let seg=0, start=performance.now(); const segDur=620;
    const step=(now)=>{ const f=framesRef.current; let tt=(now-start)/segDur;
      if(tt>=1){ seg++; if(seg>=f.length-1){ setTstate(f[f.length-1]); setRallyOn(false);
          setInfo({title:`Tennis — ${strat.k}`, body:`${strat.desc} ► ${r.outcome}`, kind:"play"}); return; }
        start=now; tt=0; }
      const a=f[seg], b=f[seg+1], e=tt<.5?2*tt*tt:1-Math.pow(-2*tt+2,2)/2, L=(p,q)=>({x:p.x+(q.x-p.x)*e,y:p.y+(q.y-p.y)*e});
      setTstate({ ball:L(a.ball,b.ball), you:a.you.map((p,i)=>L(p,b.you[i])), opp:a.opp.map((p,i)=>L(p,b.opp[i])) });
      traf.current=requestAnimationFrame(step); };
    traf.current=requestAnimationFrame(step); };
  const toCoords=useCallback((e)=>{ const r=svgRef.current.getBoundingClientRect();
    return { x:clamp(((e.clientX-r.left)*(vb[0]/r.width))/vb[0]), y:clamp(((e.clientY-r.top)*(vb[1]/r.height))/vb[1]) }; },[vb]);

  const onTokenDown=(e,id)=>{ if(playing)return; e.stopPropagation(); try{ svgRef.current.setPointerCapture(e.pointerId); }catch{}
    setSel([id]); };
  const onMove=()=>{};
  const onUp=()=>{};
  const confine=(p,x,y)=>{ x=clamp(x); y=clamp(y);
    if(sport==="baseball"||sport==="softball"){ const inf=["P","C","1B","2B","SS","3B"].indexOf(p.label)>=0;
      if(inf){ y=Math.max(.4,Math.min(.8,y)); } else { y=Math.max(.1,Math.min(.4,y)); } x=Math.max(.1,Math.min(.9,x)); }
    else if(sport==="volleyball"){ if(p.y<.5){ y=Math.max(.06,Math.min(.46,y)); } else { y=Math.max(.54,Math.min(.94,y)); } x=Math.max(.05,Math.min(.95,x)); }
    return {x,y}; };
  const onFieldDown=(e)=>{ if(playing)return; try{ svgRef.current.setPointerCapture(e.pointerId); }catch{}
    const c=toCoords(e);
    if(mode==="move"){
      if(sel[0]==="BALL"){ snapshot(); setBall(b=>({...b,x:clamp(c.x),y:clamp(c.y)})); return; }
      if(!sel.length) return; snapshot();
      if(sel.length===1){ const pl=players.find(p=>p.id===sel[0]); const z=pl?confine(pl,c.x,c.y):{x:clamp(c.x),y:clamp(c.y)}; setPlayers(ps=>ps.map(p=>p.id===sel[0]?{...p,x:z.x,y:z.y}:p)); }
      else { const grp=players.filter(p=>sel.includes(p.id)); const cx=grp.reduce((a,p)=>a+p.x,0)/grp.length, cy=grp.reduce((a,p)=>a+p.y,0)/grp.length; const dx=c.x-cx, dy=c.y-cy;
        setPlayers(ps=>ps.map(p=> sel.includes(p.id)?{...p,...confine(p,p.x+dx,p.y+dy)}:p)); } }
    else if(mode==="route"){
      if(sport==="baseball"||sport==="softball") return; // fielders are positioned, not routed
      if(sel[0]==="BALL"){ snapshot(); setBall(b=>({...b,route:[...(b.route||[]),c]})); return; }
      if(sel.length===1){ snapshot(); setPlayers(ps=>ps.map(p=>p.id===sel[0]?{...p,route:[...p.route,c]}:p)); } } };
  const ballToGoal=()=>{ if(!BALLS[sport]||!ball)return; snapshot(); setBall(b=>({...b,route:[{x:BALLS[sport].goal.x,y:BALLS[sport].goal.y}]})); setSel(["BALL"]); };
  const clearBall=()=>{ snapshot(); setBall(b=>b?{...b,route:[]}:b); };
  const tokenDownRef=useRef(onTokenDown); tokenDownRef.current=onTokenDown;
  const stableDown=useCallback((e,id)=>tokenDownRef.current(e,id),[]);
  const noop=useCallback(()=>{},[]);

  const selectAll=()=>setSel(players.map(p=>p.id));
  const addPlayer=()=>{ snapshot(); const id=`n-${Math.random().toString(36).slice(2,7)}`; setPlayers(ps=>[...ps,{id,label:"P"+(ps.length+1),x:.5,y:.5,route:[]}]); setSel([id]); };
  const removeSel=()=>{ if(!sel.length)return; snapshot(); setPlayers(ps=>ps.filter(p=>!sel.includes(p.id))); setSel([]); };
  const clearRoute=()=>{ if(!sel.length)return; snapshot(); setPlayers(ps=>ps.map(p=>sel.includes(p.id)?{...p,route:[]}:p)); };
  const rename=(v)=>setPlayers(ps=>ps.map(p=>p.id===sel[0]?{...p,label:v.slice(0,4)}:p));
  const applyCount=()=>{ const n=Math.max(1,Math.min(30,Number(customCount)||1)); snapshot(); setPlayers(makeCustom(n)); setSel([]); };
  const applyPreset=(arr,name)=>{ if(guardEdit()) return; snapshot();
    if(sport==="volleyball"){ setPlayers(makeFrom(arr)); }
    else if(side==="both"){ const off=makeFrom(arr).map(p=>({...p,team:"off"})); const def=localDefense(off).players.map(p=>({...p,team:"def"})); setPlayers([...off,...def]); }
    else setPlayers(makeFrom(arr));
    setDefense([]); setSel([]); setInfo({title:name,body:"",kind:"play"}); };
  const applyBlitz=(n)=>{ snapshot(); setPlayers(makeR(FB_BLITZ[n])); setDefense([]); setSel([]); setInfo({title:n,body:FB_BLITZ_INFO[n],kind:"def"}); };
  const buildWish=()=>{ const q=wishText.trim(); if(!q) return;
    const hit=searchLibrary(sport,q);
    if(hit){ if(sport!=="custom") setSide(hit.side); setPlayers(hit.build()); setDefense([]); setSel([]); setHistory([]);
      setInfo({title:hit.name, body:hit.info||(hit.side==="defense"?"Defensive look loaded — drag or re-route any player.":"Offensive look loaded — drag or re-route any player."), kind:hit.side==="defense"?"def":"play"}); setWishText(""); }
    else { const out=localPlay(sport,side); setPlayers(out.players); setDefense([]); setSel([]); setHistory([]);
      setInfo({title:`"${q}"`, body:"I didn't find that exact name, so here's a layout to start from. Try things like \u201ccover 2\u201d, \u201cnickel\u201d, \u201cdouble A-gap blitz\u201d, \u201cshotgun\u201d, \u201c4-3\u201d, or \u201ctriangle offense\u201d.", kind:"play"}); setWishText(""); } };

  const sbSummary=(s,b)=>{ if(!b) return ""; const P=[];
    if(s==="football") P.push(`Q${b.q>4?"OT":b.q}`,`${ord(b.down)} & ${b.dist}`,fbYardLabel(b.yard),mmss(b.clock));
    else if(s==="basketball") P.push(`Q${b.q}`,mmss(b.clock),`:${b.shot} shot`);
    else if(s==="soccer") P.push(`${b.q>2?"ET":b.q+(b.q===1?"st":"nd")+" half"}`,mmss(b.clock));
    else if(s==="hockey") P.push(`${b.per>3?"OT":b.per+(b.per===1?"st":b.per===2?"nd":"rd")} per`,mmss(b.clock));
    else if(s==="lacrosse") P.push(`Q${b.q}`,mmss(b.clock));
    else if(s==="baseball"||s==="softball") P.push(`${b.top?"Top":"Bot"} ${b.inn}`,`${b.outs} out`);
    else if(s==="volleyball") P.push(`Set ${b.set}`);
    else if(s==="tennis") P.push(`Set ${b.set}`);
    P.push(`${b.home}–${b.away}`); return P.join(" · "); };
  const savePlay=()=>{ const subscribed = plan==="plus"||plan==="unlimited";
    if(!subscribed && library.length>=5){ setShowTokens(true); setToast("Free accounts can save up to 5 plays — subscribe for unlimited."); return; }
    const bId=activeBook||(books[0]&&books[0].id)||"b-default"; const name=(libName.trim()||`${cfg.label} ${side} ${library.filter(p=>p.bookId===bId).length+1}`);
    const sit = SB_HAS.has(sport)?{...sb}:null;
    const entry={ id:`L-${Date.now()}`, name, sport, side, customName, score, players:clone(players), defense:clone(defense), bookId:bId, createdAt:Date.now(), sit, sitText: sit?sbSummary(sport,sit):"" };
    const next=[entry,...library]; setLibrary(next); pSet(LIB_KEY,next); setLibName(""); setToast(`Saved${entry.sitText?` — ${entry.sitText}`:""}`); };
  const loadPlay=(p)=>{ setSport(p.sport); setSide(p.side||"offense"); if(p.sport==="custom") setCustomName(p.customName||""); setScore(p.score||""); setPlayers(clone(p.players)); setDefense(clone(p.defense||[])); if(p.sit) setSb(p.sit); else setSb(defaultSB(p.sport)); setSel([]); setHistory([]); setInfo(null); setError(""); setView("board"); setToast(`Loaded "${p.name}"${p.sitText?` · ${p.sitText}`:""}`); };
  const deletePlay=(id)=>{ const next=library.filter(p=>p.id!==id); setLibrary(next); pSet(LIB_KEY,next); };
  const createBook=()=>{ const nm=newBookName.trim(); if(!nm) return; const b={id:`b-${Date.now()}`,name:nm,kind:newBookKind}; const next=[...books,b]; setBooks(next); pSet(BOOKS_KEY,next); setActiveBook(b.id); setNewBookName(""); setToast(`${newBookKind==="opponent"?"Opponent":"Personal"} playbook "${nm}" created`); };
  const startBookRename=()=>{ const b=books.find(x=>x.id===activeBook); if(!b) return; setBookName2(b.name); setBookEditing(true); };
  const applyBookRename=()=>{ const nm=bookName2.trim(); if(!nm){ setBookEditing(false); return; } const next=books.map(b=>b.id===activeBook?{...b,name:nm}:b); setBooks(next); pSet(BOOKS_KEY,next); setBookEditing(false); setToast("Playbook renamed"); };
  const deleteBook=(id)=>{ if(books.length<=1){ setToast("Keep at least one playbook"); return; } const nb=books.filter(b=>b.id!==id); const nl=library.filter(p=>p.bookId!==id); setBooks(nb); pSet(BOOKS_KEY,nb); setLibrary(nl); pSet(LIB_KEY,nl); setActiveBook(nb[0].id); setToast("Playbook deleted"); };
  const startPlayRename=(p)=>{ setPlayEditId(p.id); setPlayName2(p.name); };
  const applyPlayRename=()=>{ const nm=playName2.trim(); if(nm){ const next=library.map(p=>p.id===playEditId?{...p,name:nm}:p); setLibrary(next); pSet(LIB_KEY,next); } setPlayEditId(""); setPlayName2(""); };

  const b64url=(s)=>{ try{ return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }catch(e){ return ""; } };
  const b64urlDec=(s)=>{ s=String(s||"").replace(/-/g,"+").replace(/_/g,"/"); while(s.length%4) s+="="; return atob(s); };
  const shareOrigin=()=>{ try{ const o=window.location&&window.location.origin; if(o && o!=="null" && /^https?:/.test(o)){ return o + (window.location.pathname||"/"); } }catch(e){} return "https://playbook-u.app/"; };
  const encodeShare=()=>{ try{ return b64url(unescape(encodeURIComponent(JSON.stringify({s:sport,sd:side,sc:score,p:players,d:defense,i:info,fm:1})))); }catch(e){ return ""; } };
  const buildShareLink=()=>{ const base=shareOrigin().replace(/[#?].*$/,"").replace(/\/+$/,"/"); return `${base.endsWith("/")?base:base+"/"}#p=${encodeShare()}`; };
  const openShare=()=>{ setShareLink(buildShareLink()); setSharePhone(""); setShareOpen(true); };
  const copyText=async(txt)=>{
    try{ if(navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(txt); return true; } }catch(e){}
    try{ const ta=document.createElement("textarea"); ta.value=txt; ta.setAttribute("readonly",""); ta.style.position="fixed"; ta.style.top="-1000px"; ta.style.opacity="0"; document.body.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0,txt.length); const ok=document.execCommand&&document.execCommand("copy"); document.body.removeChild(ta); if(ok) return true; }catch(e){}
    try{ if(shareRef.current){ shareRef.current.focus(); shareRef.current.select(); shareRef.current.setSelectionRange&&shareRef.current.setSelectionRange(0,99999); } }catch(e){}
    return false;
  };
  const copyShare=async()=>{ const link=shareLink||buildShareLink(); const ok=await copyText(link); setToast(ok?"Link copied — paste it in any text or chat":"Tap the link box above to select it, then Copy"); };
  const sendReady = typeof window!=="undefined" && typeof window.playbookSend==="function";
  const sendPlay=async()=>{ const link=shareLink||buildShareLink(); const to=(shareTo||"").trim(); if(!to){ setToast("Enter a phone number or email first"); return; }
    const isEmail=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to);
    const title=(info&&info.title)||"A play";
    if(sendReady){
      try{ const r=await window.playbookSend({to, channel:isEmail?"email":"sms", link, title}); if(r&&r.ok){ setToast(`Sent to ${to} — it'll show up on their device`); return; } setToast((r&&r.error)?`Couldn't send: ${r.error}`:"Couldn't auto-send — opening your app instead"); }catch(e){ setToast("Couldn't auto-send — opening your app instead"); }
    }
    if(isEmail){ const subj=encodeURIComponent("A Playbook U play for you"); const body=encodeURIComponent(`Tap to watch the play:\n${link}`); try{ window.location.href=`mailto:${to}?subject=${subj}&body=${body}`; }catch(e){ copyShare(); } }
    else { const num=to.replace(/[^0-9+]/g,""); const body=encodeURIComponent(`A coach sent you a play on Playbook U — tap to see it:\n${link}`); const ios = typeof navigator!=="undefined" && /iPhone|iPad|iPod|Mac/.test(navigator.platform||navigator.userAgent||""); const sep = ios?"&":"?"; try{ window.location.href=`sms:${num}${sep}body=${body}`; }catch(e){ copyShare(); } }
  };
  const sysShare=async()=>{ const link=shareLink||buildShareLink(); try{ if(navigator.share){ await navigator.share({title:"Playbook U play", text:"A coach sent you a play on Playbook U — tap to watch it:", url:link}); return; } }catch(e){ if(e&&e.name==="AbortError") return; } copyShare(); };
  const loadShared=(code)=>{ try{ let raw=String(code||"").trim(); const m=raw.match(/[#&?]p=([^&\s]+)/); if(m) raw=m[1]; else raw=raw.split(/\s+/).pop();
    raw=(raw||"").trim().replace(/^[^A-Za-z0-9_-]+/,"").replace(/[^A-Za-z0-9_%-]+$/,""); if(/%[0-9A-Fa-f]{2}/.test(raw)){ try{ raw=decodeURIComponent(raw); }catch(e){} }
    const o=JSON.parse(decodeURIComponent(escape(b64urlDec(raw))));
    if(!o||!o.p) return false; switchSport(o.s||"football"); setSide(o.sd||"offense"); setScore(o.sc||""); setPlayers(clone(o.p)); setDefense(clone(o.d||[])); if(o.i) setInfo(o.i); setSel([]); setHistory([]); return true; }catch(e){ return false; } };
  const doImport=()=>{ if(loadShared(importCode)){ setImportCode(""); setShareOpen(false); setToast("Play loaded"); } else { setToast("That play link or code didn't work"); } };
  const planActive = plan==="plus"||plan==="unlimited"||plan==="trial";
  const locked = preview && !planActive;
  const guardEdit=()=>{ if(locked){ setShowTokens(true); return true; } return false; };

  const runLocal=(fn,key)=>{ if(guardEdit()) return; if(remaining<=0){ setShowTokens(true); return; } setError(""); setLoading(key);
    setTimeout(()=>{ try{ fn(); chargeSim(); }catch{ setError("Something went wrong generating that — please try again."); } setLoading(""); }, 260); };

  const genPlay=()=> runLocal(()=>{ const out=localPlay(sport,side); setPlayers(out.players); setDefense([]); setSel([]); setHistory([]); setInfo({title:out.name,body:out.description,kind:"play"}); }, "ai");
  const genFormation=()=>{ const n=formName.trim(); if(!n) return; runLocal(()=>{
      const all={...(FORMATIONS[sport]||{}),...(DEF_FORMATIONS[sport]||{})}; let arr=null;
      for(const k in all){ if(k.toLowerCase()===n.toLowerCase()){ arr=all[k]; break; } }
      let out; if(arr){ out={name:n, players:makeFrom(arr), description:`The ${n} alignment, set on the board. Drag anyone to fine-tune.`}; }
      else { const lp=localPlay(sport,side); out={name:n, players:lp.players.map(p=>({...p,route:[]})), description:`Your players are spread into a ${n} shape — drag anyone to adjust.`}; }
      setPlayers(out.players); setDefense([]); setSel([]); setHistory([]); setInfo({title:out.name,body:out.description,kind:"play"}); setFormName(""); }, "form"); };
  const genDefense=()=> runLocal(()=>{ const out=localDefense(players); setDefense(out.players); setInfo({title:out.name,body:out.description,kind:"def"}); }, "def");
  const simulateBoth=()=> runLocal(()=>{ const off=players.filter(p=>p.team!=="def"); const out=localDefense(off); const def=out.players.map(p=>({...p,team:"def"})); snapshot(); setPlayers([...off,...def]); setSel([]); setInfo({title:"Opponent reaction",body:"The defense shifts to shade goal-side of each attacker and jumps the routes. "+out.description,kind:"def"}); }, "def");

  const genCrunch=()=> runLocal(()=>{ const out=localCrunch(sport,crunch.time,crunch.sc); setCrunch(c=>({...c,res:out})); }, "crunch");
  const loadCrunch=()=>{ if(!crunch.res)return; setPlayers(crunch.res.players); setDefense([]); setSel([]); setHistory([]); setScore(crunch.sc||""); setInfo({title:crunch.res.name,body:crunch.res.description,kind:"play"}); setView("board"); };

  const genCounter=()=>{ const q=counter.q.trim(); if(!q) return; runLocal(()=>{ const out=localCounter(sport,q); setCounter(c=>({...c,res:out})); }, "counter"); };
  const loadCounter=()=>{ if(!counter.res)return; setPlayers(counter.res.players); setDefense([]); setSel([]); setHistory([]); setInfo({title:counter.res.name,body:counter.res.description,kind:"play"}); setView("board"); };

  const genExpert=()=> runLocal(()=>{ const out=localExpert(sport,side); setExpert({res:out}); }, "expert");
  const loadExpert=()=>{ if(!expert.res)return; setPlayers(expert.res.players); setDefense([]); setSel([]); setHistory([]); setInfo({title:expert.res.name,body:expert.res.description,kind:"play"}); setView("board"); };
  const loadU=(entry)=>{ setPlayers(makeFrom(entry.pos)); setDefense([]); setSel([]); setHistory([]); setInfo({title:entry.name,body:entry.info,kind:"play"}); setView("board"); };


  const hint = mode==="move"
    ? (sel.length>1?`Tap an open spot to move all ${sel.length} together.`:sel.length===1?"Now tap where you want this player to go.":"Tap a player to pick it up, then tap where it should go.")
    : (sel.length===1?"Tap the spots where this player should run — each tap adds a point. Use Clear route to redo.":"Tap a player to pick it, then tap the field to lay out their route.");
  const isDiamond = sport==="baseball"||sport==="softball";
  const pmActive = isDiamond && pmOn;
  const batActive = isDiamond && batOn && !pmOn;
  const fbStratActive = sport==="football" && fbStratOn;
  const bbStratActive = sport==="basketball" && bbStratOn;
  const golfActive = sport==="golf";
  const golfFrac=(d,total)=>clamp(1-d/total,0,1);
  const golfStartHole=(course,hole)=>{ const h=GOLF_COURSES[course].holes[hole-1]; setGolfDist(h.y); setGolfStrokes(0); setGolfHoled(false); setGolfClub(0); setGolfPower(100); setGolfBall(0); setGolfFly(null); };
  const golfPickCourse=(ci)=>{ cancelAnimationFrame(graf.current); setGolfCourse(ci); setGolfHole(1); setGolfTotal(0); setGolfToPar(0); setGolfLog([]); setGolfRoundDone(false); golfStartHole(ci,1); };
  const golfNewRound=()=>golfPickCourse(golfCourse);
  const golfFlyTo=(toFrac)=>{ cancelAnimationFrame(graf.current); const from=golfBall; const dur=700; let s=performance.now();
    const step=(now)=>{ const tt=Math.min(1,(now-s)/dur); const e=1-Math.pow(1-tt,2); setGolfFly({from,to:toFrac,t:e}); if(tt<1){ graf.current=requestAnimationFrame(step); } else { setGolfBall(toFrac); setGolfFly(null); } };
    graf.current=requestAnimationFrame(step); };
  const golfDoSwing=()=>{ if(golfHoled||golfRoundDone) return; const hole=GOLF_COURSES[golfCourse].holes[golfHole-1];
    const res=golfSwing(golfDist, golfClub, golfPower); const added=1+res.pen;
    const ns=golfStrokes+added; setGolfStrokes(ns);
    const club=GOLF_CLUBS[golfClub].k;
    if(res.holed){ const score=ns-hole.p; const nm=scoreName(score); setGolfTotal(t=>t+ns); setGolfToPar(tp=>tp+score);
      setGolfLog(l=>[`H${golfHole}: ${club} — ${res.note} Holed in ${ns} (${nm}).`,...l].slice(0,8));
      setGolfHoled(true); golfFlyTo(1);
    } else { setGolfDist(res.dist); setGolfLog(l=>[`H${golfHole}: ${club}${res.pen?" (+penalty)":""} — ${res.note}`,...l].slice(0,8));
      const cad=golfCaddie(res.dist); setGolfClub(cad.idx); golfFlyTo(golfFrac(res.dist,hole.y));
    } };
  const golfNextHole=()=>{ if(golfHole>=18){ setGolfRoundDone(true); return; } const nh=golfHole+1; setGolfHole(nh); golfStartHole(golfCourse,nh); };
  const ballCfg = BALLS[sport];
  const ballNow = ballCfg && ball ? (playing?posAt(ball,t):ball) : null;
  const pitcherTok = isDiamond ? players.find(p=>p.label==="P") : null;
  const moundPt = pitcherTok ? {x:pitcherTok.x,y:pitcherTok.y} : {x:.5,y:sport==="softball"?.58:.6};
  const platePt = {x:.5,y:.8};
  const pitchBall = isDiamond ? ballPos(moundPt, platePt, PITCHES[pitchSel], pp) : null;
  const sprayDots = useMemo(()=>{ if(!isDiamond) return []; const b=BATTERS[batterSel]; const arr=[]; for(let i=0;i<70;i++) arr.push(battedBall(b,batHand,PITCHES[pitchSel],PITCH_LOCS[locSel])); return arr; }, [isDiamond,batterSel,batHand,pitchSel,locSel]);
  const showBall = isDiamond;

  const SportTabs = () => (
    <div className="pb-tabs">{Object.entries(SPORTS).map(([k,v])=>(<button key={k} className={"pb-tab"+(sport===k?" on":"")} onClick={()=>switchSport(k)}>{v.label}</button>))}</div>
  );

  if(!authChecked) return (<div className="pb-root"><style>{STYLE}</style><div className="pw"><div className="pw-logo">PLAYBOOK<span className="x"> U</span></div></div></div>);

  if(!account && !preview) return (
    <div className="pb-root"><style>{STYLE}</style>
      <div className="pw">
        <div className="pw-logo">PLAYBOOK<span className="x"> U</span></div>
        <div className="pw-tag">{authMode==="signup"?"Create your account to start building plays.":"Welcome back — log in to your playbooks."}</div>
        <div className="pw-card">
          <div className="pb-seg" style={{marginBottom:16}}>
            <button className={"pb-mb"+(authMode==="signup"?" on":"")} onClick={()=>{setAuthMode("signup");setAuthErr("");}}>Sign up</button>
            <button className={"pb-mb"+(authMode==="login"?" on":"")} onClick={()=>{setAuthMode("login");setAuthErr("");}}>Log in</button>
          </div>
          {authMode==="signup" && <>
            <p className="pb-label" style={{marginBottom:6}}>Full name</p>
            <input className="pb-input" placeholder="Coach name" value={nameField} onChange={e=>{setNameField(e.target.value);setAuthErr("");}} style={{marginBottom:12}}/>
          </>}
          <p className="pb-label" style={{marginBottom:6}}>Email</p>
          <input className="pb-input" type="email" placeholder="you@email.com" value={emailField} onChange={e=>{setEmailField(e.target.value); setAuthErr("");}} onKeyDown={e=>e.key==="Enter"&&submitAuth()} style={{marginBottom:12}}/>
          <button type="button" className="pw-check2" style={{marginBottom:12}} onClick={()=>setRemember(v=>!v)}><span className={"pw-box"+(remember?" on":"")}>{remember?"✓":""}</span> Keep me signed in on this device</button>
          {authMode==="signup" && <button type="button" className="pw-check2" style={{marginBottom:12,alignItems:"flex-start"}} onClick={()=>{setAgreed(v=>!v);setAuthErr("");}}><span className={"pw-box"+(agreed?" on":"")} style={{flex:"0 0 18px",marginTop:1}}>{agreed?"✓":""}</span> <span style={{textAlign:"left"}}>I agree to the <a href="/terms" target="_blank" rel="noreferrer" style={{color:"var(--acc)",fontWeight:700}}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noreferrer" style={{color:"var(--acc)",fontWeight:700}}>Privacy Policy</a>.</span></button>}
          {authErr && <div className="pb-err" style={{marginBottom:10}}>{authErr}</div>}
          <button className="pb-btn pb-acc" style={{padding:14,fontSize:15}} onClick={submitAuth}>{authMode==="signup"?"Create account →":"Log in →"}</button>
          {authMode==="signup" && <div className="pw-feat" style={{marginTop:14}}><span className="pw-check">→</span><span>Next you'll pick a plan and start your 1-day free trial. Card details are entered securely on Stripe's checkout page — we never see or store your card.</span></div>}
          <div className="pw-fine">{authMode==="signup"?"By creating an account you agree to the Terms & Privacy Policy.":""} Demo build: your account is saved on this device only — not yet a verified, secure login. Real accounts + secure card payments turn on when Stripe & Supabase are connected (see LAUNCH.md).</div>
        </div>
      </div>
    </div>
  );

  if(!entered && !preview) return (
    <div className="pb-root"><style>{STYLE}</style>
      <div className="pw">
        <div className="pw-eyebrow">WELCOME TO</div>
        <div className="pw-logo">PLAYBOOK<span className="x"> U</span></div>
        <div className="pw-tag">The coaching whiteboard & simulator for every sport.</div>
        <div className="pw-card">
          <div style={{fontFamily:"Bebas Neue",fontSize:34,letterSpacing:1,lineHeight:1}}>Start free</div>
          <div className="pw-trial">1-day free trial — 30 simulations and full access to everything.</div>
          <div style={{margin:"14px 0 2px"}}>
            {["Whiteboard for 11+ sports — move, draw routes, animate the play",
              "Real-game simulators: football, tennis, baseball/softball matchups & more",
              "Generate a play with creative strategies for any sport",
              "Matchup Lab — pitcher vs batter, shifts, count & spray chart",
              "Build playbooks for each opponent and for personal use"].map((f,i)=>
              <div key={i} className="pw-feat"><span className="pw-check">✓</span><span>{f}</span></div>)}
          </div>
          {trialEmailUsed
            ? <div className="pw-fine" style={{marginTop:14,color:"var(--off)"}}>You've already used your one free trial on {account.email}. Choose a plan below to keep going.</div>
            : <button className="pb-btn pb-acc" style={{marginTop:14,padding:14,fontSize:15}} onClick={startTrial}>Start 1-day free trial</button>}
          <div className="pw-plans">
            <div className="pw-plan"><div><b>Unlimited</b> · make &amp; save unlimited plays · every sport &amp; feature</div><button className="pb-mini" onClick={()=>choosePlan("unlimited")}>$9.99/mo</button></div>
          </div>
          <div className="pw-fine">Signed in as {account.email}. 1-day free trial, then just $9.99/month for unlimited plays — cancel anytime.</div>
        </div>
        <div className="pw-univ">★ PLAYBOOK UNIVERSITY ★</div>
      </div>
    </div>
  );

  return (
    <div className="pb-root"><style>{STYLE}</style>
      <div className="pb-wrap">
        <div className="pb-top">
          <h1 className="pb-title pb-h1">PLAYBOOK<span className="x"> U</span></h1>
          <div className="pb-credits">{plan==="unlimited"?<><b style={{color:"var(--acc)"}}>Unlimited</b></>:<>{plan==="plus"?"Plus":"Trial"}: <b>{Math.max(0,remaining)}</b> sims left{plan==="plus"?" this month":""} · <button onClick={()=>setShowTokens(true)} style={{background:"none",border:"none",color:"var(--acc)",fontWeight:700,cursor:"pointer",padding:0,font:"inherit"}}>Upgrade</button></>}{account?<> · <span style={{opacity:.85}}>{account.email}</span> · <button onClick={signOut} style={{background:"none",border:"none",color:"var(--acc)",fontWeight:700,cursor:"pointer",padding:0,font:"inherit"}}>Sign out</button></>:null}</div>
        </div>
        {preview && (
          <div className="pb-sharebar">
            <div><b>📩 A coach shared this play with you.</b> {locked?"Watch it below for free — sign up for $9.99/mo to edit, animate, and build unlimited plays of your own.":"You're all set — edit and animate away."}</div>
            {locked && <div className="pb-row" style={{marginTop:8}}>
              <button className="pb-btn pb-acc" onClick={()=>{ if(typeof window!=="undefined" && window.playbookGoSignup){ window.playbookGoSignup(); } else { setShowTokens(true); } }}>Sign up to build your own →</button>
            </div>}
          </div>
        )}
        <div className="pb-nav">
          {[["board","Board"],["myplaybook","My Playbook"],["playbooku","Strategies"],["crunch","Crunch Time"],["counter","Counter & Tips"],["expert","Expert"],["suggestions","💡 Suggestions"]].map(([k,l])=>
            <button key={k} className={"pb-nv"+(view===k?" on":"")} onClick={()=>setView(k)}>{l}</button>)}
        </div>

        {view==="board" && <>
          <div style={{marginBottom:12}}><SportTabs/></div>
          <div className="pb-grid">
            <div className="pb-board">
              {pmActive ? (
                <div className="pb-pm">
                  <div className="pb-pmhead">
                    <span>Inning <b>{pmInn}</b>/9</span><span><b>{pmO}</b> out{pmO===1?"":"s"}</span><span>Count <b>{pmB}-{pmS}</b></span><span>Runs <b>{pmRuns}</b></span>
                  </div>
                  {(()=>{ const P=pmStaff[pmPitcher], frac=Math.min(1,pmPC/P.stamina), gassed=pmPC>P.stamina, tiring=pmPC>P.stamina*0.8;
                    const bh=pmLineup[pmBatter%pmLineup.length].hand, edge=P.hand===bh?"edge to you":"edge to hitter";
                    return (<div className="pb-pen">
                      <div className="pb-penrow">
                        <span className="pb-pname">🧢 {P.name} <b className={P.hand==="L"?"rdef":""}>{P.hand}HP</b> · {P.role}</span>
                        <span className={"pb-pc"+(gassed?" bad":tiring?" warn":"")}>{pmPC}/{P.stamina} pitches</span>
                      </div>
                      <div className="pb-bar"><div className="pb-barfill" style={{width:`${frac*100}%`,background:gassed?"var(--def)":tiring?"var(--off)":"var(--acc)"}}/></div>
                      <div className="pb-penrow"><span className="pb-mut">vs {bh}HB — platoon {edge}{gassed?" · arm is gassed!":tiring?" · tiring":""}</span>
                        <button className="pb-link" onClick={()=>setPmBullpenOpen(v=>!v)}>{pmBullpenOpen?"close bullpen":"⚾ Bullpen ▸"}</button></div>
                      {pmBullpenOpen && <div className="pb-lib" style={{maxHeight:"none",marginTop:6}}>{pmStaff.map((p,i)=> i===pmPitcher?null:(
                        <div key={i} className="pb-libitem"><span className="pb-libname">{p.name} <b className={p.hand==="L"?"rdef":""}>{p.hand}HP</b> · {p.role}{pmUsed.indexOf(i)>=0?" (used)":""}</span><span className="pb-libsport">{p.stamina}p</span>
                          <button className="pb-mini" disabled={pmUsed.indexOf(i)>=0} onClick={()=>bringIn(i)}>{pmUsed.indexOf(i)>=0?"—":"Bring in"}</button></div>))}
                        <p className="pb-hint" style={{margin:"2px 0 0",opacity:.7}}>Match a lefty on lefty (or righty on righty) for the platoon edge. Relievers tire fast — save your closer for the 9th.</p></div>}
                    </div>); })()}
                  {(()=>{ const lt=baseTip(pmBases,pmO,"defense"); return (<div className="pb-pmrow" style={{alignItems:"flex-start"}}>
                    {renderDiamond(pmBases,pmO,"defense",pmToggleBase)}
                    <div style={{flex:1,minWidth:0}}>
                      <div className="pb-hname">Now batting: <b>#{(pmBatter%9)+1} {pmLineup[pmBatter%pmLineup.length].name}</b> ({pmLineup[pmBatter%pmLineup.length].hand}HH)</div>
                      <div className="pb-htip">📋 {tipFor(pmLineup[pmBatter%pmLineup.length])}</div>
                      {(pmPlan[pmBatter%pmLineup.length]||[]).length>0 && <div className="pb-htip" style={{color:"var(--acc)",fontWeight:600}}>Your plan: {(pmPlan[pmBatter%pmLineup.length]||[]).map(planLabel).join("  →  ")}</div>}
                      {pmNotes.trim() && <div className="pb-sittip" style={{borderColor:"var(--off)"}}>📝 vs {pmOpp.trim()||"this team"}: {pmNotes.trim()}</div>}
                      {lt && <div className="pb-sittip">🏃 {lt}</div>}
                      <button className="pb-link" onClick={pmEmptyBases} style={{marginTop:6}}>empty the bases</button>
                    </div></div>); })()}
                  <div className="pb-zonehint">Move the ball with the arrows (or tap a spot), turn on Hot/Cold to scout the hitter, then <b>Throw pitch</b>. Inside the bold box is the strike zone.</div>
                  <div className="pb-zonewrap">
                    <svg viewBox="0 0 250 250" style={{width:"100%",maxWidth:300,touchAction:"manipulation"}}>
                      <rect width="250" height="250" fill="#0c1a12"/>
                      {Array.from({length:5}).map((_,r)=>Array.from({length:5}).map((_,c)=>{ const inZone=r>=1&&r<=3&&c>=1&&c<=3;
                        const av=inZone?pmAvg(pmLineup[pmBatter%pmLineup.length],c-1,r-1):0;
                        const fill = (pmHeatOn&&inZone)?pmHeatColor(av):(inZone?"rgba(54,224,138,.10)":"rgba(255,255,255,.025)");
                        return <g key={r+"-"+c}><rect x={c*50} y={r*50} width="50" height="50" fill={fill} stroke="rgba(255,255,255,.14)" strokeWidth="1" onClick={()=>setPmAim({r,c})} style={{cursor:"pointer"}}/>
                          {pmHeatOn&&inZone&&<text x={c*50+25} y={r*50+30} fill="#0c0f0c" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="Barlow" style={{pointerEvents:"none"}}>{av.toFixed(3).slice(1)}</text>}</g>; }))}
                      <rect x="50" y="50" width="150" height="150" fill="none" stroke="#fff" strokeWidth="3"/>
                      <path d="M 95 224 H 155 L 150 236 H 100 Z" fill="#fff" opacity=".85"/>
                      <text x="125" y="16" fill="rgba(255,255,255,.55)" fontSize="10.5" textAnchor="middle" fontFamily="Barlow" style={{pointerEvents:"none"}}>UP</text>
                      <text x="125" y="247" fill="rgba(255,255,255,.55)" fontSize="10.5" textAnchor="middle" fontFamily="Barlow" style={{pointerEvents:"none"}}>DOWN</text>
                      <text x="12" y="128" fill="rgba(255,255,255,.55)" fontSize="10.5" textAnchor="middle" fontFamily="Barlow" transform="rotate(-90 12 128)" style={{pointerEvents:"none"}}>INSIDE</text>
                      <text x="240" y="128" fill="rgba(255,255,255,.55)" fontSize="10.5" textAnchor="middle" fontFamily="Barlow" transform="rotate(90 240 128)" style={{pointerEvents:"none"}}>AWAY</text>
                      <g style={{pointerEvents:"none"}}><circle cx={pmAim.c*50+25} cy={pmAim.r*50+25} r="11" fill="#fff" stroke="#c0392b" strokeWidth="2.5"/><path d={`M ${pmAim.c*50+18} ${pmAim.r*50+20} Q ${pmAim.c*50+25} ${pmAim.r*50+25} ${pmAim.c*50+18} ${pmAim.r*50+30}`} stroke="#c0392b" strokeWidth="1.4" fill="none"/><path d={`M ${pmAim.c*50+32} ${pmAim.r*50+20} Q ${pmAim.c*50+25} ${pmAim.r*50+25} ${pmAim.c*50+32} ${pmAim.r*50+30}`} stroke="#c0392b" strokeWidth="1.4" fill="none"/></g>
                    </svg>
                  </div>
                  <div className="pb-dpad">
                    <button className="pb-btn pb-ghost" onClick={()=>pmNudge(-1,0)}>↑</button>
                    <div className="pb-dpad-mid">
                      <button className="pb-btn pb-ghost" onClick={()=>pmNudge(0,-1)}>←</button>
                      <button className="pb-btn pb-ghost" onClick={()=>setPmAim({r:2,c:2})}>center</button>
                      <button className="pb-btn pb-ghost" onClick={()=>pmNudge(0,1)}>→</button>
                    </div>
                    <button className="pb-btn pb-ghost" onClick={()=>pmNudge(1,0)}>↓</button>
                  </div>
                  <div className="pb-row" style={{margin:"4px 0 8px"}}>
                    <button className="pb-btn pb-acc" style={{flex:2}} onClick={pmThrowAim} disabled={pmOver}>🔥 Throw pitch</button>
                    <button className={"pb-btn "+(pmHeatOn?"pb-acc":"pb-ghost")} onClick={()=>setPmHeatOn(v=>!v)}>{pmHeatOn?"✓ Hot/Cold":"Hot/Cold zones"}</button>
                  </div>
                  <div className="pb-row" style={{marginBottom:8}}>
                    <button className="pb-btn pb-ghost" onClick={addToPlan}>＋ Add this pitch to plan</button>
                    <button className={"pb-btn "+(pmPlanOpen?"pb-acc":"pb-ghost")} onClick={()=>setPmPlanOpen(v=>!v)}>📋 Game plan</button>
                  </div>
                  {pmPlanOpen && (
                    <div className="pb-card" style={{marginBottom:10}}>
                      <p className="pb-label">📋 Opponent game plan</p>
                      <p className="pb-hint" style={{marginBottom:8}}>Plan how you'll attack each hitter: aim the ball, pick a pitch, and tap <b>Add this pitch to plan</b>. Move through the lineup, then save it under the opponent's name.</p>
                      <div className="pb-row" style={{marginBottom:8}}>
                        <button className="pb-btn pb-ghost" onClick={()=>setPmBatter(x=>(x+8)%9)}>‹ Prev hitter</button>
                        <button className="pb-btn pb-ghost" onClick={()=>setPmBatter(x=>(x+1)%9)}>Next hitter ›</button>
                      </div>
                      {(()=>{ const bi=pmBatter%pmLineup.length, h=pmLineup[bi], ZONES=["inside","outside","up","down","middle"];
                        const powLvl=h.power>=.75?"high":h.power>=.45?"med":"low", disLvl=h.eye>=.7?"patient":h.eye>=.45?"balanced":"chaser", spdLvl=(h.spd||.5)>=.7?"fast":(h.spd||.5)>=.45?"avg":"slow";
                        return (<div className="pb-card" style={{background:"var(--panel2)",marginBottom:10}}>
                          <button className="pb-link" onClick={()=>setPmEditOpen(v=>!v)} style={{marginBottom:pmEditOpen?8:0}}>{pmEditOpen?"▾ Hide hitter details":`✎ Edit hitter #${bi+1} (${h.name})`}</button>
                          {pmEditOpen && <>
                            <div className="pb-row" style={{marginBottom:8}}>
                              <input className="pb-input" placeholder="Hitter name" value={h.name} onChange={e=>updateHitter(bi,"name",e.target.value.slice(0,14))}/>
                              <div className="pb-seg" style={{flex:"0 0 110px"}}>
                                <button className={"pb-mb"+(h.hand==="R"?" on":"")} onClick={()=>updateHitter(bi,"hand","R")}>R</button>
                                <button className={"pb-mb"+(h.hand==="L"?" on":"")} onClick={()=>updateHitter(bi,"hand","L")}>L</button>
                              </div>
                            </div>
                            <p className="pb-hint" style={{margin:"4px 0 4px"}}>🔥 Hot zone (crushes it):</p>
                            <div className="pb-chips" style={{marginBottom:6}}>{ZONES.map(z=><button key={z} className={"pb-chip"+(h.loves===z?" pbsel":"")} onClick={()=>updateHitter(bi,"loves",z)}>{z}</button>)}</div>
                            <p className="pb-hint" style={{margin:"4px 0 4px"}}>❄️ Cold zone (weak spot):</p>
                            <div className="pb-chips" style={{marginBottom:6}}>{ZONES.map(z=><button key={z} className={"pb-chip"+(h.hates===z?" pbsel":"")} onClick={()=>updateHitter(bi,"hates",z)}>{z}</button>)}</div>
                            <p className="pb-hint" style={{margin:"4px 0 4px"}}>Power:</p>
                            <div className="pb-seg" style={{marginBottom:6}}>{[["low",.25],["med",.55],["high",.9]].map(([l,v])=><button key={l} className={"pb-mb"+(powLvl===l?" on":"")} onClick={()=>updateHitter(bi,"power",v)}>{l}</button>)}</div>
                            <p className="pb-hint" style={{margin:"4px 0 4px"}}>Discipline:</p>
                            <div className="pb-seg" style={{marginBottom:6}}>{[["chaser",.55,.3],["balanced",.4,.55],["patient",.2,.85]].map(([l,c,ey])=><button key={l} className={"pb-mb"+(disLvl===l?" on":"")} onClick={()=>updateHitterVals(bi,{chase:c,eye:ey})}>{l}</button>)}</div>
                            <p className="pb-hint" style={{margin:"4px 0 4px"}}>Speed (on the bases):</p>
                            <div className="pb-seg">{[["slow",.3],["avg",.55],["fast",.9]].map(([l,v])=><button key={l} className={"pb-mb"+(spdLvl===(l==="avg"?"avg":l)?" on":"")} onClick={()=>updateHitter(bi,"spd",v)}>{l}</button>)}</div>
                          </>}
                        </div>); })()}
                      <p className="pb-hint" style={{marginBottom:6}}>Plan for <b>#{(pmBatter%9)+1} {pmLineup[pmBatter%pmLineup.length].name}</b>:</p>
                      {(pmPlan[pmBatter%HITTERS_PM.length]||[]).length>0 ? (
                        <div className="pb-lib" style={{maxHeight:"none",marginBottom:8}}>{(pmPlan[pmBatter%HITTERS_PM.length]||[]).map((e,i)=>(
                          <div key={i} className="pb-libitem"><span className="pb-libname">{i+1}. {planLabel(e)} · {e.mph}mph</span><button className="pb-mini x" onClick={()=>removeFromPlan(i)}>✕</button></div>))}
                          <button className="pb-mini x" style={{alignSelf:"flex-start"}} onClick={clearHitterPlan}>Clear this hitter</button></div>
                      ) : <p className="pb-hint" style={{marginBottom:8,opacity:.7}}>No pitches planned for this hitter yet.</p>}
                      <p className="pb-label" style={{fontSize:12,margin:"4px 0 5px"}}>📝 Approach vs this team — how you'll attack them</p>
                      <textarea className="pb-input" style={{minHeight:74,resize:"vertical",lineHeight:1.4}} placeholder="e.g. Pound them inside, they chase low sliders. Aggressive early in counts. Bunt to move runners. Make their #4 hitter beat us — pitch around him with runners on." value={pmNotes} onChange={e=>setPmNotes(e.target.value)} maxLength={600}/>
                      <div className="pb-row" style={{marginTop:8,marginBottom:10}}>
                        <input className="pb-input" placeholder="Opponent name (e.g. Central High)…" value={pmOpp} onChange={e=>setPmOpp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveGamePlan()}/>
                        <button className="pb-btn pb-acc" style={{flex:"0 0 84px"}} onClick={saveGamePlan}>💾 Save</button>
                      </div>
                      {gamePlans.length>0 && <>
                        <p className="pb-label" style={{fontSize:12,marginBottom:6}}>Saved opponent game plans</p>
                        <div className="pb-lib" style={{maxHeight:"none"}}>{gamePlans.map(g=>(
                          <div key={g.id} className="pb-libitem"><span className="pb-libname">🛡 {g.opponent}{g.notes?" · 📝":""}</span><span className="pb-libsport">{Object.values(g.plan||{}).reduce((a,x)=>a+(x?x.length:0),0)} pitches</span>
                            <button className="pb-mini" onClick={()=>loadGamePlan(g)}>Load</button><button className="pb-mini x" onClick={()=>deleteGamePlan(g.id)}>✕</button></div>))}</div>
                      </>}
                    </div>
                  )}
                  <p className="pb-plk" style={{margin:"4px 0 4px"}}>Your pitch — {PITCHES[pitchSel].k} · <b style={{color:"var(--acc)"}}>{pitchMph} mph</b></p>
                  <input type="range" className="pb-range" min={sport==="softball"?40:50} max={sport==="softball"?80:105} value={pitchMph} onChange={e=>setPitchMph(+e.target.value)}/>
                  <div className="pb-seg" style={{margin:"4px 0 8px"}}>{(sport==="softball"?[50,55,60,65,70]:[70,75,80,85,90,95]).map(v=><button key={v} className={"pb-mb"+(pitchMph===v?" on":"")} onClick={()=>setPitchMph(v)}>{v}</button>)}</div>
                  <div className="pb-chips" style={{marginBottom:8}}>{PITCHES.map((p,i)=><button key={p.k} className={"pb-chip"+(i===pitchSel?" pbsel":"")} onClick={()=>selectPitch(i)}>{p.k}</button>)}</div>
                  <div className="pb-pmlog">{pmLog.length?pmLog.map((t,i)=><div key={i} className="pb-logline" style={{opacity:i===0?1:.55}}>{t}</div>):<div className="pb-logline" style={{opacity:.55}}>Choose a pitch and a spot to begin the game.</div>}</div>
                  {pmOver && <div className="pb-result" style={{marginTop:10}}><b>Final</b> {pmFinal}</div>}
                  <div className="pb-row" style={{marginTop:10}}>
                    <button className="pb-btn pb-ghost" onClick={()=>setPmOn(false)}>← Exit Pitcher Mode</button>
                    <button className="pb-btn pb-ghost" onClick={pmReset}>↻ New game</button>
                  </div>
                </div>
              ) : batActive ? (
                <div className="pb-pm">
                  <div className="pb-seg" style={{marginBottom:10}}>
                    <button className={"pb-mb"+(batView==="card"?" on":"")} onClick={()=>setBatView("card")}>Lineup card</button>
                    <button className={"pb-mb"+(batView==="sim"?" on":"")} onClick={()=>setBatView("sim")}>Face a pitcher</button>
                  </div>
                  {batView==="card" ? (<>
                  <div className="pb-pmhead"><span>🏏 Lineup card</span><span className="pb-mut">Tap a spot to edit or pinch-hit</span></div>
                  <div className="pb-card2">
                    {batLineup.map((b,i)=>(
                      <div key={i} className={"pb-lurow"+(i===batSpot?" sel":"")} onClick={()=>setBatSpot(i)}>
                        <span className="pb-luord">{i+1}</span>
                        <span className="pb-lupos">{b.pos}</span>
                        <span className="pb-luname">{b.name} <b className={b.hand==="L"?"rdef":(b.hand==="S"?"":"")}>{b.hand}</b></span>
                        <span className="pb-lubars">{[["P",b.power,"var(--def)"],["C",b.contact,"var(--acc)"],["S",b.speed,"var(--off)"]].map(([k,v,col])=>(
                          <span key={k} className="pb-lubar" title={k}><span style={{width:`${v*100}%`,background:col}}/></span>))}</span>
                      </div>))}
                  </div>
                  {(()=>{ const b=batLineup[batSpot]; const lvl=(v)=>v>=.75?"high":v>=.45?"med":"low";
                    return (<div className="pb-card" style={{background:"var(--panel2)",marginTop:10}}>
                      <button className="pb-link" onClick={()=>setBatEditOpen(v=>!v)} style={{marginBottom:batEditOpen?8:0}}>{batEditOpen?"▾ Hide batter details":`✎ Edit #${batSpot+1} ${b.name}`}</button>
                      {batEditOpen && <>
                        <div className="pb-row" style={{marginBottom:8}}>
                          <input className="pb-input" placeholder="Name" value={b.name} onChange={e=>updateBatter(batSpot,"name",e.target.value.slice(0,14))}/>
                          <input className="pb-input" style={{flex:"0 0 70px"}} placeholder="Pos" value={b.pos} onChange={e=>updateBatter(batSpot,"pos",e.target.value.slice(0,3).toUpperCase())}/>
                        </div>
                        <p className="pb-hint" style={{margin:"2px 0 4px"}}>Bats:</p>
                        <div className="pb-seg" style={{marginBottom:6}}>{["R","L","S"].map(hd=><button key={hd} className={"pb-mb"+(b.hand===hd?" on":"")} onClick={()=>updateBatter(batSpot,"hand",hd)}>{hd==="S"?"Switch":hd}</button>)}</div>
                        {[["power","Power"],["contact","Contact"],["speed","Speed"],["eye","Discipline"]].map(([f,lab])=>(
                          <div key={f}><p className="pb-hint" style={{margin:"4px 0 4px"}}>{lab}:</p>
                            <div className="pb-seg" style={{marginBottom:6}}>{[["low",.25],["med",.55],["high",.9]].map(([l,v])=><button key={l} className={"pb-mb"+(lvl(b[f])===l?" on":"")} onClick={()=>updateBatter(batSpot,f,v)}>{l}</button>)}</div></div>))}
                      </>}
                    </div>); })()}
                  <p className="pb-label" style={{fontSize:12,margin:"12px 0 6px"}}>🪑 Bench — tap to sub into spot #{batSpot+1}</p>
                  <div className="pb-lib" style={{maxHeight:"none"}}>{batBench.map((b,i)=>(
                    <div key={i} className="pb-libitem"><span className="pb-libname">{b.name} <b className={b.hand==="L"?"rdef":""}>{b.hand}</b> · {b.pos}{b.note?` — ${b.note}`:""}</span>
                      <button className="pb-mini" onClick={()=>pinchHit(i)}>Sub in</button></div>))}</div>
                  <div className="pb-row" style={{margin:"12px 0 0"}}>
                    <input className="pb-input" placeholder="Lineup name (e.g. vs LHP)…" value={batName} onChange={e=>setBatName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveLineupCard()}/>
                    <button className="pb-btn pb-acc" style={{flex:"0 0 84px"}} onClick={saveLineupCard}>💾 Save</button>
                  </div>
                  {lineupCards.length>0 && <>
                    <p className="pb-label" style={{fontSize:12,margin:"10px 0 6px"}}>Saved lineup cards</p>
                    <div className="pb-lib" style={{maxHeight:"none"}}>{lineupCards.map(l=>(
                      <div key={l.id} className="pb-libitem"><span className="pb-libname">📋 {l.name}</span>
                        <button className="pb-mini" onClick={()=>loadLineupCard(l)}>Load</button><button className="pb-mini x" onClick={()=>deleteLineupCard(l.id)}>✕</button></div>))}</div>
                  </>}
                  </>) : (<>
                  <div className="pb-pen">
                    <div className="pb-penrow"><span className="pb-pname">⚾ {oppP.name} <b className={oppP.hand==="L"?"rdef":""}>{oppP.hand}HP</b> · {oppP.velo} mph</span>
                      <button className="pb-link" onClick={()=>setOppEdit(v=>!v)}>{oppEdit?"done":"✎ Customize"}</button></div>
                    <div className="pb-mut" style={{marginTop:3}}>Throws: {oppP.pitches.map(k=>k.replace(" Fastball","")).join(", ")}</div>
                    {oppEdit && <div style={{marginTop:8}}>
                      <input className="pb-input" style={{width:"100%",marginBottom:8}} placeholder="Pitcher name" value={oppP.name} onChange={e=>setOppP(p=>({...p,name:e.target.value.slice(0,16)}))}/>
                      <p className="pb-hint" style={{margin:"2px 0 4px"}}>Throws:</p>
                      <div className="pb-seg" style={{marginBottom:6}}>{["R","L"].map(hd=><button key={hd} className={"pb-mb"+(oppP.hand===hd?" on":"")} onClick={()=>setOppP(p=>({...p,hand:hd}))}>{hd==="R"?"Righty":"Lefty"}</button>)}</div>
                      <p className="pb-hint" style={{margin:"2px 0 4px"}}>Velocity: <b>{oppP.velo} mph</b></p>
                      <input type="range" className="pb-range" min="50" max="105" value={oppP.velo} onChange={e=>setOppP(p=>({...p,velo:+e.target.value}))}/>
                      <div className="pb-seg" style={{margin:"6px 0"}}>{[70,75,80,85,90,95].map(v=><button key={v} className={"pb-mb"+(oppP.velo===v?" on":"")} onClick={()=>setOppP(p=>({...p,velo:v}))}>{v}</button>)}</div>
                      <p className="pb-hint" style={{margin:"2px 0 4px"}}>Arsenal (tap to toggle):</p>
                      <div className="pb-chips">{PITCHES.map(p=><button key={p.k} className={"pb-chip"+(oppP.pitches.indexOf(p.k)>=0?" pbsel":"")} onClick={()=>toggleArsenal(p.k)}>{p.k.replace(" Fastball","")}</button>)}</div>
                    </div>}
                  </div>
                  <div className="pb-pmhead"><span>Inning <b>{bgInn}</b>/9</span><span><b>{bgO}</b> out{bgO===1?"":"s"}</span><span>Count <b>{bgB}-{bgS}</b></span><span>Runs <b>{bgRuns}</b></span></div>
                  {(()=>{ const b=batLineup[bgBatter%batLineup.length], lt=baseTip(bgBases,bgO,"offense"); return (<div className="pb-pmrow" style={{alignItems:"flex-start"}}>
                    {renderDiamond(bgBases,bgO,"offense",bgToggleBase)}
                    <div style={{flex:1,minWidth:0}}>
                      <div className="pb-hname">At bat: <b>#{(bgBatter%batLineup.length)+1} {b.name}</b> ({b.hand})</div>
                      <div className="pb-htip" style={{color:"var(--acc)"}}>🧠 {coachRead(b,oppP)}</div>
                      {lt && <div className="pb-sittip">🏃 {lt}</div>}
                      <button className="pb-link" onClick={bgEmptyBases} style={{marginTop:6}}>empty the bases</button>
                    </div></div>); })()}
                  <p className="pb-hint" style={{margin:"6px 0 4px"}}>How should he prepare?</p>
                  <div className="pb-chips" style={{marginBottom:8}}>{APPROACHES.map(([k,l])=><button key={k} className={"pb-chip"+(bgApproach===k?" pbsel":"")} onClick={()=>setBgApproach(k)}>{l}</button>)}</div>
                  <p className="pb-hint" style={{margin:"2px 0 4px"}}>Where does {oppP.name} throw it? Tap a spot or use the arrows.</p>
                  <div className="pb-zonewrap">
                    <svg viewBox="0 0 250 250" style={{width:"100%",maxWidth:280,touchAction:"manipulation"}}>
                      <rect width="250" height="250" fill="#0c1a12"/>
                      {Array.from({length:5}).map((_,r)=>Array.from({length:5}).map((_,c)=>{ const inZone=r>=1&&r<=3&&c>=1&&c<=3;
                        return <rect key={r+"-"+c} x={c*50} y={r*50} width="50" height="50" fill={inZone?"rgba(54,224,138,.10)":"rgba(255,255,255,.025)"} stroke="rgba(255,255,255,.14)" strokeWidth="1" onClick={()=>setBgAim({r,c})} style={{cursor:"pointer"}}/>; }))}
                      <rect x="50" y="50" width="150" height="150" fill="none" stroke="#fff" strokeWidth="3"/>
                      <g style={{pointerEvents:"none"}}><circle cx={bgAim.c*50+25} cy={bgAim.r*50+25} r="11" fill="#fff" stroke="#c0392b" strokeWidth="2.5"/></g>
                    </svg>
                  </div>
                  <div className="pb-dpad">
                    <button className="pb-btn pb-ghost" onClick={()=>bgNudge(-1,0)}>↑</button>
                    <div className="pb-dpad-mid"><button className="pb-btn pb-ghost" onClick={()=>bgNudge(0,-1)}>←</button><button className="pb-btn pb-ghost" onClick={()=>setBgAim({r:2,c:2})}>center</button><button className="pb-btn pb-ghost" onClick={()=>bgNudge(0,1)}>→</button></div>
                    <button className="pb-btn pb-ghost" onClick={()=>bgNudge(1,0)}>↓</button>
                  </div>
                  <p className="pb-plk" style={{margin:"4px 0 6px"}}>His pitch:</p>
                  <div className="pb-chips" style={{marginBottom:8}}>{oppP.pitches.map((k,i)=><button key={k} className={"pb-chip"+(i===bgPitch%oppP.pitches.length?" pbsel":"")} onClick={()=>setBgPitch(i)}>{k.replace(" Fastball","")}</button>)}</div>
                  <div className="pb-row" style={{marginBottom:8}}>
                    <button className="pb-btn pb-acc" style={{flex:2}} onClick={bgSim} disabled={bgOver}>▶ Simulate pitch</button>
                    <button className="pb-btn pb-ghost" onClick={bgReset}>↻ New game</button>
                  </div>
                  <div className="pb-pmlog">{bgLog.length?bgLog.map((t,i)=><div key={i} className="pb-logline" style={{opacity:i===0?1:.55}}>{t}</div>):<div className="pb-logline" style={{opacity:.55}}>Set the approach and the location, pick his pitch, then simulate the at-bat.</div>}</div>
                  {bgOver && <div className="pb-result" style={{marginTop:10}}><b>Final</b> {bgFinal}</div>}
                  </>)}
                  <div className="pb-row" style={{marginTop:12}}>
                    <button className="pb-btn pb-ghost" onClick={()=>setBatOn(false)}>← Exit Batter Mode</button>
                  </div>
                </div>
              ) : fbStratActive ? (
                <div className="pb-pm">
                  <div className="pb-pmhead"><span>🏈 Strategy Mode</span><span className="pb-mut">situational football</span></div>
                  <div className="pb-fbfield" onClick={(e)=>{ const r=e.currentTarget.getBoundingClientRect(); const y=Math.round(((e.clientX-r.left)/r.width*300-20)/2.6); setFbYard(Math.max(1,Math.min(99,y))); }}>
                    <svg viewBox="0 0 300 64" style={{width:"100%",touchAction:"manipulation",cursor:"pointer"}}>
                      <rect x="0" y="6" width="20" height="52" fill="rgba(231,76,60,.25)"/><rect x="280" y="6" width="20" height="52" fill="rgba(54,224,138,.25)"/>
                      <rect x="20" y="6" width="260" height="52" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.18)"/>
                      {[10,20,30,40,50,60,70,80,90].map(y=><line key={y} x1={20+y*2.6} y1="6" x2={20+y*2.6} y2="58" stroke="rgba(255,255,255,.12)"/>)}
                      <line x1={20+Math.min(99,fbYard+fbDist)*2.6} y1="6" x2={20+Math.min(99,fbYard+fbDist)*2.6} y2="58" stroke="var(--off)" strokeWidth="2" strokeDasharray="4 3"/>
                      <line x1={20+fbYard*2.6} y1="2" x2={20+fbYard*2.6} y2="62" stroke="#fff" strokeWidth="1.5"/>
                      <ellipse cx={20+fbYard*2.6} cy="32" rx="6" ry="4" fill="#8b4a2b" stroke="#fff" strokeWidth="1.2"/>
                      <text x="20" y="50" fill="rgba(255,255,255,.5)" fontSize="7" fontFamily="Barlow" transform="rotate(-90 11 32)" textAnchor="middle">YOUR EZ</text>
                    </svg>
                    <div className="pb-mut" style={{textAlign:"center",marginTop:4}}>Ball at <b style={{color:"var(--ink)"}}>{fbYardLabel(fbYard)}</b> · {fbDown}{fbDown===1?"st":fbDown===2?"nd":fbDown===3?"rd":"th"} & {fbYard+fbDist>=100?"goal":fbDist} · tap the field or drag the slider to set the spot</div>
                  </div>
                  <input type="range" className="pb-range" min="1" max="99" value={fbYard} onChange={e=>setFbYard(+e.target.value)}/>
                  <div className="pb-fbgrid">
                    <div><p className="pb-hint">Down</p><div className="pb-seg">{[1,2,3,4].map(d=><button key={d} className={"pb-mb"+(fbDown===d?" on":"")} onClick={()=>setFbDown(d)}>{d}</button>)}</div></div>
                    <div><p className="pb-hint">Distance: {fbYard+fbDist>=100?"goal":fbDist}</p><div className="pb-seg"><button className="pb-mb" onClick={()=>setFbDist(d=>Math.max(1,d-1))}>−</button><button className="pb-mb" onClick={()=>setFbDist(10)}>10</button><button className="pb-mb" onClick={()=>setFbDist(d=>Math.min(30,d+1))}>+</button></div></div>
                  </div>
                  <div className="pb-fbgrid">
                    <div><p className="pb-hint">Quarter</p><div className="pb-seg">{[1,2,3,4].map(q=><button key={q} className={"pb-mb"+(fbQtr===q?" on":"")} onClick={()=>setFbQtr(q)}>{q}</button>)}</div></div>
                    <div><p className="pb-hint">Clock: {fbClockStr(fbClock)}</p><div className="pb-seg"><button className="pb-mb" onClick={()=>setFbClock(c=>Math.max(0,c-15))}>−15s</button><button className="pb-mb" onClick={()=>setFbClock(c=>Math.min(900,c+60))}>+1m</button><button className="pb-mb" onClick={()=>setFbClock(120)}>2:00</button></div></div>
                  </div>
                  <div className="pb-fbgrid">
                    <div><p className="pb-hint">Your timeouts</p><div className="pb-to">{[0,1,2].map(i=><span key={i} className={"pb-todot"+(i<fbTO?" on":"")}/>)}<button className="pb-mini" onClick={()=>setFbTO(t=>Math.max(0,t-1))}>use</button><button className="pb-mini" onClick={()=>setFbTO(3)}>↺</button></div></div>
                    <div><p className="pb-hint">Opp timeouts</p><div className="pb-to">{[0,1,2].map(i=><span key={i} className={"pb-todot"+(i<fbOppTO?" on":"")}/>)}<button className="pb-mini" onClick={()=>setFbOppTO(t=>Math.max(0,t-1))}>use</button><button className="pb-mini" onClick={()=>setFbOppTO(3)}>↺</button></div></div>
                  </div>
                  <div className="pb-fbgrid">
                    <div><p className="pb-hint">You: {fbUs}</p><div className="pb-seg"><button className="pb-mb" onClick={()=>setFbUs(v=>Math.max(0,v-1))}>−</button><button className="pb-mb" onClick={()=>setFbUs(v=>v+1)}>+</button></div></div>
                    <div><p className="pb-hint">Them: {fbThem}</p><div className="pb-seg"><button className="pb-mb" onClick={()=>setFbThem(v=>Math.max(0,v-1))}>−</button><button className="pb-mb" onClick={()=>setFbThem(v=>v+1)}>+</button></div></div>
                  </div>
                  <div className="pb-sittip" style={{marginTop:10}}>🧠 {fbStratRead({yard:fbYard,down:fbDown,dist:fbYard+fbDist>=100?(100-fbYard):fbDist,qtr:fbQtr,clock:fbClock,to:fbTO,diff:fbUs-fbThem})}</div>
                  <p className="pb-hint" style={{margin:"12px 0 6px"}}>Call your play — load it onto the board:</p>
                  <button className="pb-btn pb-acc" style={{width:"100%",marginBottom:8}} onClick={fbAutoCall}>⚡ Generate the call for this situation</button>
                  <div className="pb-chips">{FB_PLAYS.map(p=><button key={p.k} className={"pb-chip"+(fbPlay===p.k?" pbsel":"")} onClick={()=>fbLoadPlay(p)}>{p.k}</button>)}</div>
                  <div className="pb-row" style={{marginTop:12}}>
                    <button className="pb-btn pb-ghost" onClick={()=>setFbStratOn(false)}>← Back to the Board</button>
                  </div>
                </div>
              ) : bbStratActive ? (
                <div className="pb-pm">
                  <div className="pb-pmhead"><span>🏀 Strategy Mode</span><span className="pb-mut">situational basketball</span></div>
                  <div className="pb-fbgrid">
                    <div><p className="pb-hint">Quarter</p><div className="pb-seg">{[1,2,3,4].map(q=><button key={q} className={"pb-mb"+(bbQtr===q?" on":"")} onClick={()=>setBbQtr(q)}>{q}</button>)}</div></div>
                    <div><p className="pb-hint">Game clock: {bbClockStr(bbClock)}</p><div className="pb-seg"><button className="pb-mb" onClick={()=>setBbClock(c=>Math.max(0,c-12))}>−12s</button><button className="pb-mb" onClick={()=>setBbClock(c=>Math.min(720,c+60))}>+1m</button><button className="pb-mb" onClick={()=>setBbClock(20)}>:20</button></div></div>
                  </div>
                  <div className="pb-fbgrid">
                    <div><p className="pb-hint">Shot clock: {bbShot}</p><div className="pb-seg">{[24,14,7].map(v=><button key={v} className={"pb-mb"+(bbShot===v?" on":"")} onClick={()=>setBbShot(v)}>{v}</button>)}</div></div>
                    <div><p className="pb-hint">Your timeouts</p><div className="pb-to">{[0,1,2,3].map(i=><span key={i} className={"pb-todot"+(i<bbTO?" on":"")}/>)}<button className="pb-mini" onClick={()=>setBbTO(t=>Math.max(0,t-1))}>use</button><button className="pb-mini" onClick={()=>setBbTO(4)}>↺</button></div></div>
                  </div>
                  <div className="pb-fbgrid">
                    <div><p className="pb-hint">You: {bbUs}</p><div className="pb-seg"><button className="pb-mb" onClick={()=>setBbUs(v=>Math.max(0,v-1))}>−</button><button className="pb-mb" onClick={()=>setBbUs(v=>v+1)}>+1</button><button className="pb-mb" onClick={()=>setBbUs(v=>v+2)}>+2</button><button className="pb-mb" onClick={()=>setBbUs(v=>v+3)}>+3</button></div></div>
                    <div><p className="pb-hint">Them: {bbThem}</p><div className="pb-seg"><button className="pb-mb" onClick={()=>setBbThem(v=>Math.max(0,v-1))}>−</button><button className="pb-mb" onClick={()=>setBbThem(v=>v+1)}>+1</button><button className="pb-mb" onClick={()=>setBbThem(v=>v+2)}>+2</button><button className="pb-mb" onClick={()=>setBbThem(v=>v+3)}>+3</button></div></div>
                  </div>
                  <div className="pb-fbgrid">
                    <div><p className="pb-hint">Their team fouls: {bbFoulThem}</p><div className="pb-seg"><button className="pb-mb" onClick={()=>setBbFoulThem(v=>Math.max(0,v-1))}>−</button><button className="pb-mb" onClick={()=>setBbFoulThem(v=>v+1)}>+</button></div></div>
                  </div>
                  <div className="pb-sittip" style={{marginTop:10}}>🧠 {bbStratRead({clock:bbClock,shot:bbShot,qtr:bbQtr,diff:bbUs-bbThem,to:bbTO,foulThem:bbFoulThem})}</div>
                  <p className="pb-hint" style={{margin:"12px 0 6px"}}>Call a set — it'll run on the board:</p>
                  <button className="pb-btn pb-acc" style={{width:"100%",marginBottom:8}} onClick={bbAutoCall}>⚡ Generate the call for this situation</button>
                  <div className="pb-chips">{BB_PLAYS.map(p=><button key={p.k} className={"pb-chip"+(bbPlay===p.k?" pbsel":"")} onClick={()=>bbLoadPlay(p)}>{p.k}</button>)}</div>
                  <div className="pb-row" style={{marginTop:12}}>
                    <button className="pb-btn pb-ghost" onClick={()=>setBbStratOn(false)}>← Back to the Board</button>
                  </div>
                </div>
              ) : golfActive ? ((()=>{
                const course=GOLF_COURSES[golfCourse], hole=course.holes[golfHole-1], par=hole.p, isPar3=par===3;
                const W=300,H=540, teeY=H*0.92, pinY=H*0.10;
                const ballFrac = golfFly?golfFly.from+(golfFly.to-golfFly.from)*golfFly.t:golfBall;
                const by=teeY-(teeY-pinY)*ballFrac;
                const distTxt = golfHoled?"In the hole 🏁":(golfDist<10?`${Math.max(1,Math.round(golfDist*3))} ft to the pin`:`${Math.round(golfDist)} yds to the pin`);
                const cad=golfCaddie(golfDist);
                return (<div className="pb-pm">
                  <div className="pb-pmhead"><span>⛳ {course.name}</span><span className="pb-mut">{course.sub}</span></div>
                  <div className="pb-chips" style={{marginBottom:8}}>{GOLF_COURSES.map((c,i)=><button key={c.name} className={"pb-chip"+(i===golfCourse?" pbsel":"")} onClick={()=>golfPickCourse(i)}>{c.name}</button>)}</div>
                  <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{maxHeight:"44vh",display:"block",margin:"0 auto",borderRadius:14}}>
                    <rect x="0" y="0" width={W} height={H} fill="#2f7d46"/>
                    <path d={`M${W*0.34} ${teeY+12} Q ${W*0.18} ${H*0.55} ${W*0.4} ${pinY+34} L ${W*0.6} ${pinY+34} Q ${W*0.82} ${H*0.55} ${W*0.66} ${teeY+12} Z`} fill="#5bb56e"/>
                    <ellipse cx={W*0.3} cy={H*0.34} rx="26" ry="14" fill="#e9d9a8"/>
                    <ellipse cx={W*0.69} cy={pinY+H*0.14} rx="22" ry="12" fill="#e9d9a8"/>
                    {isPar3 && <rect x={W*0.18} y={pinY+H*0.055} width={W*0.64} height={H*0.05} rx="9" fill="#4aa3e0" opacity="0.85"/>}
                    <ellipse cx={W*0.5} cy={pinY} rx={W*0.17} ry={H*0.062} fill="#86e6a0" stroke="#3f9d59" strokeWidth="2"/>
                    <circle cx={W*0.5} cy={pinY} r="3.2" fill="#15301c"/>
                    <line x1={W*0.5} y1={pinY} x2={W*0.5} y2={pinY-28} stroke="#f2f2f2" strokeWidth="2"/>
                    <polygon points={`${W*0.5},${pinY-28} ${W*0.5+16},${pinY-23} ${W*0.5},${pinY-18}`} fill="#e2483d"/>
                    <rect x={W*0.44} y={teeY+10} width={W*0.12} height="9" rx="3" fill="#d6ecdb"/>
                    {golfFly && <line x1={W*0.5} y1={teeY-(teeY-pinY)*golfFly.from} x2={W*0.5} y2={by} stroke="rgba(255,255,255,.6)" strokeWidth="2" strokeDasharray="3 5"/>}
                    <circle cx={W*0.5} cy={by} r="6" fill="#fff" stroke="#9bbf1e" strokeWidth="1.5"/>
                  </svg>
                  <div className="pb-fbgrid" style={{marginTop:8}}>
                    <div className="pb-hint">Hole {golfHole}{hole.n?` · ${hole.n}`:""}</div>
                    <div className="pb-hint" style={{textAlign:"right"}}>Par {par} · {hole.y} yds</div>
                  </div>
                  <div className="pb-fbgrid">
                    <div className="pb-hint">Strokes: <b style={{color:"var(--ink)"}}>{golfStrokes}</b></div>
                    <div className="pb-hint" style={{textAlign:"right"}}>Round: <b style={{color:"var(--off)"}}>{golfParLabel(golfToPar)}</b> · {golfTotal} total</div>
                  </div>
                  <div className="pb-sittip" style={{marginTop:8}}>📏 {distTxt}</div>
                  {!golfHoled && !golfRoundDone && <div className="pb-sittip" style={{marginTop:6}}>🏌️ Caddie: {cad.txt}</div>}
                  {!golfHoled && !golfRoundDone && <><p className="pb-hint" style={{margin:"10px 0 5px"}}>Club</p>
                  <div className="pb-chips">{GOLF_CLUBS.map((c,i)=><button key={c.k} className={"pb-chip"+(i===golfClub?" pbsel":"")} onClick={()=>setGolfClub(i)}>{c.k}</button>)}</div>
                  <p className="pb-hint" style={{margin:"10px 0 4px"}}>Swing power: {golfPower}%{GOLF_CLUBS[golfClub].base>0?` · ~${Math.round(GOLF_CLUBS[golfClub].base*golfPower/100)} yds carry`:""}</p>
                  <input type="range" min="50" max="110" value={golfPower} onChange={e=>setGolfPower(+e.target.value)} className="pb-range"/></>}
                  {golfRoundDone ? (
                    <div className="pb-sittip" style={{marginTop:12}}>🏁 Round complete at {course.name}: {golfTotal} strokes, {golfParLabel(golfToPar)} to par.</div>
                  ) : golfHoled ? (
                    <button className="pb-btn pb-acc" style={{width:"100%",marginTop:12}} onClick={golfNextHole}>{golfHole>=18?"Finish round →":`Next hole (${golfHole+1}) →`}</button>
                  ) : (
                    <button className="pb-btn pb-acc" style={{width:"100%",marginTop:12}} onClick={golfDoSwing}>🏌️ Swing — {GOLF_CLUBS[golfClub].k}</button>
                  )}
                  <div className="pb-row" style={{marginTop:8}}><button className="pb-btn pb-ghost" onClick={golfNewRound}>↺ Restart round</button></div>
                  {golfLog.length>0 && <div style={{marginTop:10}}>{golfLog.map((l,i)=><div key={i} className="pb-suggitem" style={{fontSize:12}}>{l}</div>)}</div>}
                </div>);
              })()
              ) : (<>
              {SB_HAS.has(sport) && (
                <div className="pb-sb">
                  <div className="pb-sb-grid">
                    {sbFields(sport).map(f=>(
                      <div key={f.lab} className="pb-sb-cell"><div className="pb-sb-lab">{f.lab}</div><div className="pb-sb-val">{f.val}</div><div className="pb-sb-btns"><button onClick={f.dec}>−</button><button onClick={f.inc}>+</button></div></div>
                    ))}
                  </div>
                  <div className="pb-sb-score"><span>HOME</span><button onClick={()=>sbStep("home",-1,0,199)}>−</button><b>{sb.home}</b><button onClick={()=>sbStep("home",1,0,199)}>+</button><span className="pb-sb-dash">–</span><button onClick={()=>sbStep("away",-1,0,199)}>−</button><b>{sb.away}</b><button onClick={()=>sbStep("away",1,0,199)}>+</button><span>AWAY</span></div>
                </div>
              )}
              <div style={{marginBottom:10}}>
                <p className="pb-hint" style={{margin:"0 0 5px"}}>✦ Describe a play in your words and Playbook U builds it:</p>
                <textarea className="pb-input" style={{minHeight:50,resize:"vertical",lineHeight:1.35}} placeholder={aiPlaceholder} value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)}/>
                <button className="pb-btn pb-acc" style={{width:"100%",marginTop:6}} onClick={runDescribed}>✦ Generate my play</button>
              </div>
              {sport==="football" && <button className="pb-btn pb-acc" style={{width:"100%",marginBottom:10}} onClick={()=>setFbStratOn(true)}>🏈 Strategy Mode — situational game management</button>}
              {sport==="basketball" && <button className="pb-btn pb-acc" style={{width:"100%",marginBottom:8}} onClick={()=>setBbStratOn(true)}>🏀 Strategy Mode — situational play-calling</button>}
              {sport==="basketball" && (<div style={{marginBottom:10}}>
                <button className={"pb-btn "+(bbScreenOpen?"pb-acc":"pb-ghost")} style={{width:"100%"}} onClick={()=>setBbScreenOpen(v=>!v)}>🛡 Screen — add any screen to the play {bbScreenOpen?"▴":"▾"}</button>
                {bbScreenOpen && (<div style={{marginTop:8}}>
                  <p className="pb-hint" style={{margin:"0 0 5px"}}>Tap a screen to set it up and run it with the players on the board — the defense reacts:</p>
                  <div className="pb-chips">{BB_SCREENS.map(s=><button key={s.k} className="pb-chip" title={s.d} onClick={()=>runBBScreen(s.gen,s.k,s.d)}>{s.k}</button>)}</div>
                </div>)}
              </div>)}
              <div className="pb-seg">
                <button className={"pb-mb"+(side==="offense"?" on":"")} onClick={()=>switchSide("offense")}>Offense</button>
                <button className={"pb-mb"+(side==="defense"?" on":"")} onClick={()=>switchSide("defense")}>Defense</button>
                <button className={"pb-mb"+(side==="both"?" on":"")} onClick={()=>switchSide("both")}>Both</button>
              </div>
              {sport==="football" && (side==="defense"||side==="both") && <button className={"pb-btn "+(fbZoneOn?"pb-acc":"pb-ghost")} style={{width:"100%",marginBottom:8}} onClick={()=>setFbZoneOn(v=>!v)}>{fbZoneOn?"◉ Zone coverage on — showing defender zones":"◯ Show zone coverage"}</button>}
              <div className="pb-seg">
                <button className={"pb-mb"+(mode==="move"?" on":"")} onClick={()=>setMode("move")}>✋ Move</button>
                <button className={"pb-mb"+(mode==="route"?" on":"")} onClick={()=>setMode("route")}>➤ Route</button>
                <button className={"pb-mb"+(playing?" live":"")} onClick={runPlay}>{playing?"⏹ Stop":"▶ Run play"}</button>
              </div>
              <div className="pb-play">
                <span className="pb-plk">Speed</span>
                {[[0.5,"½×"],[1,"1×"],[2,"2×"]].map(([s,l])=><button key={l} className={"pb-chip"+(speed===s?" pbsel":"")} onClick={()=>setSpeed(s)}>{l}</button>)}
                <button className={"pb-chip"+(loop?" pbsel":"")} onClick={()=>setLoop(v=>!v)} style={{marginLeft:"auto"}}>↻ Loop {loop?"on":"off"}</button>
              </div>
              {ballCfg && <div className="pb-play">
                <span className="pb-plk">Ball</span>
                <button className={"pb-chip"+(sel[0]==="BALL"?" pbsel":"")} onClick={()=>{setMode("route"); setSel(["BALL"]);}}>Route the ball</button>
                <button className="pb-chip" onClick={ballToGoal}>Send to goal</button>
                <button className="pb-chip" onClick={clearBall}>Clear path</button>
              </div>}
              <div className="pb-hintbar">{hint}</div>
              <div className="pb-svgwrap">
                <svg ref={svgRef} viewBox={`0 0 ${vb[0]} ${vb[1]}`} style={{width:"100%",maxWidth:vb[0]*0.92,height:"auto",touchAction:"none",borderRadius:14,boxShadow:"0 16px 38px rgba(0,0,0,.45)",border:"1px solid rgba(255,255,255,.1)",background:"#0a120d"}}
                  onPointerDown={onFieldDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
                  <defs>
                    <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a8a4e"/><stop offset="1" stopColor="#136030"/></linearGradient>
                    <linearGradient id="turf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f8a77"/><stop offset="1" stopColor="#0f5a4f"/></linearGradient>
                    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cd9050"/><stop offset="1" stopColor="#9a672f"/></linearGradient>
                    <linearGradient id="court" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d08646"/><stop offset="1" stopColor="#9c5526"/></linearGradient>
                    <linearGradient id="clay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4d9466"/><stop offset="1" stopColor="#2f6041"/></linearGradient>
                    <linearGradient id="ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e0f1fb"/><stop offset="1" stopColor="#a8cbe7"/></linearGradient>
                    <linearGradient id="pool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a90d4"/><stop offset="1" stopColor="#125890"/></linearGradient>
                    <linearGradient id="indoor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3c5648"/><stop offset="1" stopColor="#283a30"/></linearGradient>
                    <linearGradient id="canvas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3d4a63"/><stop offset="1" stopColor="#2c3852"/></linearGradient>
                    <linearGradient id="cage" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#26331f"/><stop offset="1" stopColor="#19241a"/></linearGradient>
                    <linearGradient id="neutral" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1c2e24"/><stop offset="1" stopColor="#12201a"/></linearGradient>
                    <radialGradient id="vig" cx="50%" cy="42%" r="75%"><stop offset="55%" stopColor="#000" stopOpacity="0"/><stop offset="100%" stopColor="#000" stopOpacity="0.34"/></radialGradient>
                    <marker id="arrow-o" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--off)"/></marker>
                    <marker id="arrow-b" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#fff"/></marker>
                    <marker id="arrow-d" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--def)"/></marker>
                  </defs>
                  <Field sport={sport} customName={customName}/>
                  <rect width={vb[0]} height={vb[1]} fill="url(#vig)" style={{pointerEvents:"none"}}/>
                  {defense.map(p=><Token key={p.id} p={p} vb={vb} color="var(--def)" selected={false} onDown={noop} at={playing?posAt(p,t):null}/>)}
                  {sport==="football" && fbZoneOn && players.filter(p=>(p.team==="def"||side==="defense") && /^(LB|CB|S|FS|SS|NB)$/.test(p.label)).map(p=>{ const pos=playing?posAt(p,t):{x:p.x,y:p.y}; const rad=/^S|FS|SS$/.test(p.label)?.17:p.label==="CB"?.15:p.label==="NB"?.14:.13; return <circle key={"z"+p.id} cx={pos.x*vb[0]} cy={pos.y*vb[1]} r={rad*vb[0]} fill="rgba(86,141,247,.13)" stroke="rgba(140,180,255,.55)" strokeWidth="1.5" strokeDasharray="6 4"/>; })}
                  {sport!=="tennis" && players.map(p=><Token key={p.id} p={p} vb={vb} color={sport==="volleyball"?(p.y<.5?"var(--def)":"var(--off)"):(p.team==="def"?"var(--def)":"var(--off)")} selected={isSel(p.id)} onDown={stableDown} at={playing?posAt(p,t):null}/>)}
                  {sport==="tennis" && tstate && (<g>
                    {tstate.you.map((p,i)=><g key={"ty"+i}><circle cx={p.x*vb[0]} cy={p.y*vb[1]} r="15" fill="var(--off)" stroke="rgba(0,0,0,.35)" strokeWidth="2"/><text x={p.x*vb[0]} y={p.y*vb[1]+4} fill="#0c0f0c" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="Barlow">{i===0?"You":"P2"}</text></g>)}
                    {tstate.opp.map((p,i)=><g key={"to"+i}><circle cx={p.x*vb[0]} cy={p.y*vb[1]} r="15" fill="var(--def)" stroke="rgba(0,0,0,.35)" strokeWidth="2"/><text x={p.x*vb[0]} y={p.y*vb[1]+4} fill="#0c0f0c" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="Barlow">{i===0?"Opp":"P2"}</text></g>)}
                    <circle cx={tstate.ball.x*vb[0]} cy={tstate.ball.y*vb[1]} r="6" fill="#d6f24a" stroke="#9bbf1e" strokeWidth="1.5"/>
                  </g>)}
                  {isDiamond && (<g style={{pointerEvents:"none"}}>
                    {showSpray && sprayDots.map((d,i)=><circle key={"sp"+i} cx={d.x*vb[0]} cy={d.y*vb[1]} r="4.5" fill={d.q>.64?"rgba(54,224,138,.5)":d.q>.4?"rgba(233,196,106,.5)":"rgba(231,76,60,.45)"}/>)}
                    <rect x={(.5-.014)*vb[0]} y={(.8-.014)*vb[1]} width={.028*vb[0]} height={.028*vb[1]} fill="#fff" opacity=".95" transform={`rotate(45 ${.5*vb[0]} ${.8*vb[1]})`}/>
                    {[["R",.43],["L",.57]].map(([hand,bx])=>(
                      <rect key={hand} x={(bx-.028)*vb[0]} y={(.8-.052)*vb[1]} width={.056*vb[0]} height={.104*vb[1]} fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="1.5" strokeDasharray="4 3" rx="2"/>
                    ))}
                    {(()=>{ const bx=batHand==="R"?.43:.57; return (<g transform={`translate(${bx*vb[0]},${.78*vb[1]})`}>
                      <line x1={batHand==="R"?4:-4} y1="-4" x2={batHand==="R"?15:-15} y2="-15" stroke="#e9c46a" strokeWidth="3" strokeLinecap="round"/>
                      <circle r="8" fill="var(--off)" stroke="#fff" strokeWidth="2"/>
                      <text y="3" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#06210f" fontFamily="Barlow">{batHand}</text>
                    </g>); })()}
                    <text x={.035*vb[0]} y={.065*vb[1]} fill="var(--ink)" fontSize="13" fontWeight="800" fontFamily="Barlow">{balls}-{strikes} · {outs} out{outs===1?"":"s"}</text>
                    {showBall && !hitBall && <circle cx={pitchBall.x*vb[0]} cy={pitchBall.y*vb[1]} r="5.5" fill="#fff" stroke="#c0392b" strokeWidth="2"/>}
                    {isDiamond && hitBall && <circle cx={(platePt.x+(hitBall.x-platePt.x)*bp)*vb[0]} cy={(platePt.y+(hitBall.y-platePt.y)*bp)*vb[1]} r="5.5" fill="#fff" stroke="#c0392b" strokeWidth="2"/>}
                  </g>)}
                  {ballCfg && ball && ballNow && (<g>
                    {ball.route.length>0 && <path d={rPath(ball,ball.route,vb)} fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="2 7" markerEnd="url(#arrow-b)" opacity={playing?.45:.95} strokeLinecap="round"/>}
                    {sel[0]==="BALL" && <circle cx={ballNow.x*vb[0]} cy={ballNow.y*vb[1]} r="17" fill="none" stroke="#fff" strokeWidth="2" opacity=".8"><animate attributeName="r" values="15;19;15" dur="1.4s" repeatCount="indefinite"/></circle>}
                    <g onPointerDown={(e)=>stableDown(e,"BALL")} style={{cursor:"pointer"}}>
                      <circle cx={ballNow.x*vb[0]} cy={ballNow.y*vb[1]} r="20" fill="transparent"/>
                      <BallGlyph kind={ballCfg.kind} cx={ballNow.x*vb[0]} cy={ballNow.y*vb[1]}/>
                    </g>
                  </g>)}
                  {lasso && <rect x={Math.min(lasso.x0,lasso.x1)*vb[0]} y={Math.min(lasso.y0,lasso.y1)*vb[1]} width={Math.abs(lasso.x1-lasso.x0)*vb[0]} height={Math.abs(lasso.y1-lasso.y0)*vb[1]} fill="rgba(54,224,138,.12)" stroke="var(--acc)" strokeWidth="2" strokeDasharray="6 4"/>}
                </svg>
              </div>
              <div className="pb-legend">
                <span><span className="pb-dot" style={{background:"var(--off)"}}/>{side==="both"?"Offense":`Your ${side}`}</span>
                <span><span className="pb-dot" style={{background:"var(--def)"}}/>{side==="both"?"Defense":"Opponent"}</span>
                <span style={{marginLeft:"auto"}}>{sportName} · {players.length} players</span>
              </div>
              <div className="pb-editbar">
                <div className="pb-row" style={{marginBottom:8}}>
                  <button className="pb-btn pb-ghost" onClick={selectAll}>Select all</button>
                  <button className="pb-btn pb-ghost" onClick={addPlayer}>+ Add</button>
                  <button className="pb-btn pb-acc" onClick={savePlay}>💾 Save</button>
                </div>
                {!(plan==="plus"||plan==="unlimited") && <p className="pb-hint" style={{margin:"0 0 8px"}}>{library.length>=5?"You've hit the 5-play free limit — ":`${5-library.length} of 5 free saves left — `}<button onClick={()=>setShowTokens(true)} style={{background:"none",border:"none",color:"var(--acc)",fontWeight:700,cursor:"pointer",padding:0,font:"inherit"}}>subscribe for unlimited</button>.</p>}
                <div className="pb-row" style={{marginBottom:8}}>
                  <button className="pb-btn pb-ghost" onClick={undo} disabled={!history.length}>↩ Undo</button>
                  <button className="pb-btn pb-ghost" onClick={resetPlay}>↺ Reset</button>
                  <button className="pb-btn pb-ghost" onClick={flipPlay}>⇄ Flip</button>
                </div>
                {sel.length>1 ? (<div><div className="pb-sel">{sel.length} selected — tap an open spot to move them together</div>
                    <div className="pb-row"><button className="pb-btn pb-ghost" onClick={()=>setSel([])}>Deselect</button><button className="pb-btn pb-ghost" onClick={removeSel}>Remove</button></div></div>)
                : sel[0]==="BALL" ? (<div><div className="pb-sel">Ball selected — in Route mode, tap the field to send it where you want it to go.</div>
                    <div className="pb-row"><button className="pb-btn pb-ghost" onClick={ballToGoal}>Send to goal</button><button className="pb-btn pb-ghost" onClick={clearBall} disabled={!ball||!ball.route.length}>Clear path</button></div></div>)
                : selPlayer ? (<div><div className="pb-row" style={{marginBottom:8}}><input className="pb-input" value={selPlayer.label} onChange={e=>rename(e.target.value)}/>
                      <button className="pb-btn pb-ghost" style={{flex:"0 0 84px"}} onClick={removeSel}>Remove</button></div>
                    <button className="pb-btn pb-ghost" onClick={clearRoute} disabled={!selPlayer.route.length}>Clear this route</button>
                    {mode==="route" && <div style={{marginTop:10}}><span className="pb-plk">Route type</span><div className="pb-chips" style={{marginTop:6}}>{[["run","Run"],["pass","Pass"],["block","Block"],["motion","Motion"]].map(([rt,l])=><button key={rt} className={"pb-chip"+(((selPlayer.routeType||"run")===rt)?" pbsel":"")} onClick={()=>setRouteType(rt)}>{l}</button>)}</div></div>}</div>)
                : <p className="pb-hint" style={{marginTop:4}}>Tap a player to pick it. Use Select all to grab everyone.</p>}
              </div>
              <button className="pb-btn pb-acc" style={{width:"100%",marginTop:12,padding:13,fontSize:15}} onClick={generatePlay} disabled={playing||rallyOn||pitching}>⚡ Generate a play</button>
              {info && info.body && (<div className="pb-result"><b className={info.kind==="def"?"rdef":""}>{info.title}</b> {info.body}</div>)}
              {outcome && (<div className={"pb-outcome"+(outcome.kind==="def"?" def":"")}>▶ {outcome.t}</div>)}
              </>)}
            </div>

            <div className="pb-side">
              <div className="pb-row">
                <button className="pb-btn pb-ghost" onClick={openShare}>↗ Share play</button>
              </div>

              {info && info.body && (<div className="pb-card pb-infocard"><p className={"pb-info-t"+(info.kind==="def"?" def":"")}>{info.title}</p><p className="pb-info-b">{info.body}</p>{outcome && <p className={"pb-outcome"+(outcome.kind==="def"?" def":"")}>▶ {outcome.t}</p>}</div>)}

              {isDiamond && (
                <div className="pb-card">
                  <p className="pb-label">⚾ Matchup lab — pitcher vs batter</p>
                  <button className="pb-btn pb-acc" style={{width:"100%",marginBottom:8}} onClick={()=>{ if(!pmOn){ pmReset(); setBatOn(false); } setPmOn(v=>!v); }}>{pmOn?"● Pitcher Mode is on — playing on the board":"⚾ Pitcher Mode — pitch a 9-inning game"}</button>
                  <button className="pb-btn pb-acc" style={{width:"100%",marginBottom:12}} onClick={()=>{ if(!batOn){ setPmOn(false); } setBatOn(v=>!v); }}>{batOn?"● Batter Mode is on — lineup card on the board":"🏏 Batter Mode — build & save your lineup"}</button>
                  <div className="pb-count">
                    <span>Count <b>{balls}-{strikes}</b></span><span>·</span><span><b>{outs}</b> out{outs===1?"":"s"}</span>
                    <button className="pb-mini" onClick={()=>{setBalls(0);setStrikes(0);}}>New batter</button>
                    <button className="pb-mini" onClick={()=>{setBalls(0);setStrikes(0);setOuts(0);}}>New inning</button>
                  </div>
                  <p className="pb-hint" style={{marginBottom:6}}><b>1. Who's hitting?</b> Flip the batter and pick how he hits — the defense should move to match.</p>
                  <div className="pb-seg" style={{marginBottom:8}}>
                    <button className={"pb-mb"+(batHand==="R"?" on":"")} onClick={()=>{setBatHand("R");setBalls(0);setStrikes(0);}}>🏏 Righty</button>
                    <button className={"pb-mb"+(batHand==="L"?" on":"")} onClick={()=>{setBatHand("L");setBalls(0);setStrikes(0);}}>Lefty 🏏</button>
                  </div>
                  <div className="pb-chips" style={{marginBottom:6}}>{BATTERS.map((b,i)=><button key={b.k} className={"pb-chip"+(i===batterSel?" pbsel":"")} onClick={()=>{setBatterSel(i);setBalls(0);setStrikes(0);}}>{b.k}</button>)}</div>
                  <p className="pb-hint" style={{marginBottom:8,opacity:.85}}>{BATTERS[batterSel].desc} <b>Bats {batHand==="R"?"right — pulls to left field.":"left — pulls to right field."}</b></p>
                  <div className="pb-row" style={{marginBottom:12}}>
                    <button className="pb-btn pb-ghost" onClick={()=>setDefenseFor(batterSel)}>↔ Set the defense</button>
                    <button className={"pb-btn "+(showSpray?"pb-acc":"pb-ghost")} onClick={()=>setShowSpray(s=>!s)}>{showSpray?"✓ Spray chart":"Show spray chart"}</button>
                  </div>
                  <p className="pb-hint" style={{marginBottom:6}}><b>2. The pitch.</b> Pick the pitch, where you're throwing it, and the velocity.</p>
                  <div className="pb-chips" style={{marginBottom:6}}>{PITCHES.map((p,i)=><button key={p.k} className={"pb-chip"+(i===pitchSel?" pbsel":"")} onClick={()=>selectPitch(i)}>{p.k}</button>)}</div>
                  <div className="pb-chips" style={{marginBottom:10}}>{PITCH_LOCS.map((l,i)=><button key={l} className={"pb-chip"+(i===locSel?" pbsel":"")} onClick={()=>setLocSel(i)}>{l}</button>)}</div>
                  <div className="pb-row" style={{alignItems:"center",gap:10,marginBottom:6}}>
                    <input type="range" className="pb-range" min={sport==="softball"?40:50} max={sport==="softball"?80:105} value={pitchMph} onChange={e=>setPitchMph(+e.target.value)} style={{flex:1}}/>
                    <span style={{flex:"0 0 64px",textAlign:"right",fontWeight:800,color:"var(--acc)"}}>{pitchMph} mph</span>
                  </div>
                  <div className="pb-seg" style={{marginBottom:10}}>{(sport==="softball"?[50,55,60,65,70]:[70,75,80,85,90,95]).map(v=><button key={v} className={"pb-mb"+(pitchMph===v?" on":"")} onClick={()=>setPitchMph(v)}>{v}</button>)}</div>
                  <button className="pb-btn pb-acc" onClick={throwPitch} disabled={pitching}>{pitching?"In play…":"⚾ Throw the pitch"}</button>
                  <p className="pb-hint" style={{margin:"10px 0 6px"}}><b>Bunt</b> — lay it down either line:</p>
                  <div className="pb-row">
                    <button className="pb-btn pb-ghost" onClick={()=>buntPlay("3B")} disabled={pitching}>↙ Bunt 3B line</button>
                    <button className="pb-btn pb-ghost" onClick={()=>buntPlay("1B")} disabled={pitching}>Bunt 1B line ↘</button>
                  </div>
                  {pitchOut && <p className="pb-hint" style={{marginTop:10}}><b>Result:</b> {pitchOut}</p>}
                  <p className="pb-hint" style={{marginTop:8,opacity:.8}}>Where the ball is hit depends on the batter, the pitch, and the location — and whether your fielders are positioned to get there. Each pitch uses one simulation.</p>
                </div>
              )}

              {sport==="tennis" && (
                <div className="pb-card">
                  <p className="pb-label">🎾 Tennis match</p>
                  <div className="pb-seg" style={{marginBottom:8}}>
                    <button className={"pb-mb"+(!tDoubles?" on":"")} onClick={()=>setTDoubles(false)}>Singles</button>
                    <button className={"pb-mb"+(tDoubles?" on":"")} onClick={()=>setTDoubles(true)}>Doubles</button>
                  </div>
                  <p className="pb-hint" style={{marginBottom:6}}>{side==="defense"?"You're returning — the opponent serves to you. Pick how you defend:":"You serve. Pick how you attack:"}</p>
                  <div className="pb-chips" style={{marginBottom:10}}>{(side==="defense"?TENNIS_STRATS.defense:TENNIS_STRATS.offense).map((s,i)=><button key={s.k} className={"pb-chip"+(i===tStrat?" pbsel":"")} onClick={()=>setTStrat(i)}>{s.k}</button>)}</div>
                  <button className="pb-btn pb-acc" onClick={tennisPlay} disabled={rallyOn}>{rallyOn?"Playing the point…":"🎾 Play the point"}</button>
                  <p className="pb-hint" style={{marginTop:8,opacity:.8}}>The offense serves; the defense defends. Each point uses one simulation.</p>
                </div>
              )}

              <div className="pb-card">
                <p className="pb-label">Formations · {side==="both"?"offense":side}</p>
                {presets && <div className="pb-chips">{Object.keys(presets).map(name=><button key={name} className="pb-chip" onClick={()=>applyPreset(presets[name],name)}>{name}</button>)}</div>}
                {sport==="football" && side==="defense" && (<>
                  <p className="pb-hint" style={{margin:"10px 0 6px"}}>Blitz packages — rushers show their path</p>
                  <div className="pb-chips">{Object.keys(FB_BLITZ).map(n=><button key={n} className="pb-chip pb-chipd" onClick={()=>applyBlitz(n)}>{n}</button>)}</div>
                </>)}
                <div className="pb-row" style={{marginTop:10}}>
                  <input className="pb-input" placeholder="Type any formation…" value={formName} onChange={e=>setFormName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&genFormation()}/>
                  <button className="pb-btn pb-ghost" style={{flex:"0 0 96px"}} onClick={genFormation} disabled={!!loading}>{loading==="form"?<span className="pb-spin"/>:"Generate"}</button>
                </div>
              </div>

              {sport==="custom" && (
                <div className="pb-card">
                  <p className="pb-label">Custom sport</p>
                  <input className="pb-input" placeholder="Sport name" value={customName} onChange={e=>setCustomName(e.target.value)} style={{marginBottom:8}}/>
                  <div className="pb-row"><input className="pb-input" type="number" min="1" max="30" value={customCount} onChange={e=>setCustomCount(e.target.value)}/>
                    <button className="pb-btn pb-ghost" style={{flex:"0 0 110px"}} onClick={applyCount}>Set players</button></div>
                </div>
              )}

              <div className="pb-card">
                <p className="pb-label">AI creative {side}</p>
                <button className="pb-btn pb-off" onClick={genPlay} disabled={!!loading}>{loading==="ai"?<><span className="pb-spin"/>Designing…</>:"Generate a play"}</button>
                <p className="pb-hint" style={{marginTop:8}}>An out-of-the-box {side} play to spark ideas.</p>
              </div>
              {side==="both" && (<div className="pb-card">
                <p className="pb-label">Opponent reaction</p>
                <button className="pb-btn pb-def" onClick={simulateBoth} disabled={!!loading}>{loading==="def"?<><span className="pb-spin"/>Reading…</>:"Simulate the opponent"}</button>
                <p className="pb-hint" style={{marginTop:8}}>Moves the red defense to react to your offense — they shade goal-side and jump the routes. Then hit ▶ Run play. Uses one simulation.</p>
              </div>)}

              {error && <div className="pb-err">{error}</div>}

              <div className="pb-card">
                <p className="pb-label">Save a play</p>
                <p className="pb-hint" style={{marginBottom:8}}>Saving to <b>{(books.find(b=>b.id===activeBook)||{}).name||"My Playbook"}</b> · <button className="pb-link" onClick={()=>setView("myplaybook")}>open My Playbook →</button></p>
                <input className="pb-input" placeholder="Add a score/situation (optional)" value={score} onChange={e=>setScore(e.target.value)} style={{marginBottom:8}}/>
                <div className="pb-row"><input className="pb-input" placeholder="Name this play…" value={libName} onChange={e=>setLibName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&savePlay()}/>
                  <button className="pb-btn pb-acc" style={{flex:"0 0 84px"}} onClick={savePlay}>Save</button></div>
                {library.filter(p=>p.bookId===activeBook).length>0 ? (<div className="pb-lib">{library.filter(p=>p.bookId===activeBook).slice(0,6).map(p=>(
                    <div key={p.id} className="pb-libitem"><span className="pb-libname">{p.name}{p.sitText?<span className="pb-sittag"> · {p.sitText}</span>:""}</span>
                      <span className="pb-libsport">{SPORTS[p.sport]?.label||p.sport}</span>
                      <button className="pb-mini" onClick={()=>loadPlay(p)}>Load</button><button className="pb-mini x" onClick={()=>deletePlay(p.id)}>✕</button></div>))}</div>)
                  : <p className="pb-hint" style={{marginTop:9}}>No saved plays yet. Design one and hit Save.</p>}
                <p className="pb-hint" style={{marginTop:8}}>Saved to your account.{!canPersist?" (Saving isn't available here — screenshot the board or use Share to keep a play.)":" Tip: you can also screenshot the board or Share to back up a play."}</p>
                <div className="pb-row" style={{marginTop:8}}><input className="pb-input" placeholder="Paste a play code…" value={importCode} onChange={e=>setImportCode(e.target.value)}/>
                  <button className="pb-btn pb-ghost" style={{flex:"0 0 84px"}} onClick={doImport}>Import</button></div>
              </div>
            </div>
          </div>
        </>}

        {view==="myplaybook" && (() => { const bookPlays = library.filter(p=>p.bookId===activeBook); const shownPlays = bookPlays.filter(p=>sitMatch(p,sitFilter)); const activeBk=books.find(b=>b.id===activeBook)||{}; const activeName=activeBk.name||"My Playbook"; const badge=k=>k==="opponent"?"🛡":"⭐"; const shownBooks=books.filter(b=>bookFilter==="all"||(b.kind||"personal")===bookFilter); return (
          <div className="pb-section">
            <div className="pb-card" style={{marginBottom:14}}>
              <p className="pb-label">📕 My Playbooks</p>
              <p className="pb-hint" style={{marginBottom:10}}>Make a playbook for each <b>opponent</b> you're scouting, plus your own <b>personal</b> books. Tap one to open it, then save plays into it from the Board.</p>
              <div className="pb-seg" style={{marginBottom:10}}>
                {[["all","All"],["personal","⭐ Personal"],["opponent","🛡 Opponents"]].map(([k,l])=><button key={k} className={"pb-mb"+(bookFilter===k?" on":"")} onClick={()=>setBookFilter(k)}>{l}</button>)}
              </div>
              <div className="pb-chips" style={{marginBottom:10}}>{shownBooks.length?shownBooks.map(b=><button key={b.id} className={"pb-chip"+(b.id===activeBook?" pbsel":"")} onClick={()=>{setActiveBook(b.id);setBookEditing(false);}}>{badge(b.kind)} {b.name} · {library.filter(p=>p.bookId===b.id).length}</button>):<span className="pb-hint">No {bookFilter} playbooks yet — create one below.</span>}</div>
              <p className="pb-hint" style={{marginBottom:6}}>New playbook — is it for an opponent or for your own use?</p>
              <div className="pb-seg" style={{marginBottom:8}}>
                {[["personal","⭐ Personal"],["opponent","🛡 Opponent"]].map(([k,l])=><button key={k} className={"pb-mb"+(newBookKind===k?" on":"")} onClick={()=>setNewBookKind(k)}>{l}</button>)}
              </div>
              <div className="pb-row" style={{marginBottom:bookEditing?10:0}}>
                <input className="pb-input" placeholder={newBookKind==="opponent"?"Opponent name (e.g. Central High)…":"Playbook name (e.g. Base Offense)…"} value={newBookName} onChange={e=>setNewBookName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createBook()}/>
                <button className="pb-btn pb-acc" style={{flex:"0 0 92px"}} onClick={createBook}>+ Create</button>
              </div>
              {bookEditing ? (<div className="pb-row"><input className="pb-input" value={bookName2} onChange={e=>setBookName2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&applyBookRename()}/>
                  <button className="pb-btn pb-acc" style={{flex:"0 0 84px"}} onClick={applyBookRename}>Save</button>
                  <button className="pb-btn pb-ghost" style={{flex:"0 0 84px"}} onClick={()=>setBookEditing(false)}>Cancel</button></div>)
                : (<div className="pb-row" style={{marginTop:10}}>
                  <button className="pb-btn pb-ghost" onClick={startBookRename}>✎ Rename "{activeName}"</button>
                  <button className="pb-btn pb-ghost" onClick={()=>deleteBook(activeBook)} disabled={books.length<=1}>🗑 Delete playbook</button></div>)}
            </div>

            <div className="pb-card" style={{marginBottom:14}}>
              <p className="pb-label">Save the current board → {badge(activeBk.kind)} {activeName}</p>
              <p className="pb-hint" style={{marginBottom:8}}>Whatever is on the Board right now — players, routes, formation — gets saved as a play in this playbook.</p>
              <div className="pb-row"><input className="pb-input" placeholder="Name this play…" value={libName} onChange={e=>setLibName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&savePlay()}/>
                <button className="pb-btn pb-acc" style={{flex:"0 0 92px"}} onClick={savePlay}>💾 Save</button></div>
              {!canPersist && <p className="pb-hint" style={{marginTop:8,color:"var(--def)"}}>Heads up: saving to your account isn't available in this environment, so plays won't persist after you close the app. Screenshot or Share to keep them.</p>}
            </div>

            <div className="pb-card">
              <p className="pb-label">{badge(activeBk.kind)} {activeName} — {shownPlays.length} of {bookPlays.length} {bookPlays.length===1?"play":"plays"}</p>
              <div className="pb-chips" style={{marginBottom:10}}>{[["all","All"],["redzone","🟥 Red zone"],["third","3rd & long"],["fourth","4th down"],["twomin","⏱ 2-min"],["close","Close & late"]].map(([k,l])=><button key={k} className={"pb-chip"+(sitFilter===k?" pbsel":"")} onClick={()=>setSitFilter(k)}>{l}</button>)}</div>
              {shownPlays.length>0 ? (<div className="pb-lib" style={{maxHeight:"none"}}>{shownPlays.map(p=>(
                  <div key={p.id} className="pb-pbitem">
                    {playEditId===p.id ? (<div className="pb-row" style={{width:"100%"}}><input className="pb-input" value={playName2} onChange={e=>setPlayName2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&applyPlayRename()} autoFocus/>
                        <button className="pb-mini" onClick={applyPlayRename}>Save</button></div>)
                      : (<>
                        <div style={{flex:1,minWidth:0}}>
                          <div className="pb-libname" style={{fontSize:14}}>{p.name}</div>
                          {p.sitText && <div className="pb-sittag">🏟 {p.sitText}</div>}
                          <div className="pb-pbmeta">{SPORTS[p.sport]?.label||p.sport} · {p.side||"offense"} · {(p.players||[]).length} players{p.createdAt?` · saved ${new Date(p.createdAt).toLocaleDateString()}`:""}</div>
                        </div>
                        <button className="pb-mini" onClick={()=>loadPlay(p)}>Load</button>
                        <button className="pb-mini" onClick={()=>startPlayRename(p)}>✎</button>
                        <button className="pb-mini x" onClick={()=>deletePlay(p.id)}>✕</button></>)}
                  </div>))}</div>)
                : <p className="pb-hint" style={{marginTop:6}}>{bookPlays.length>0?"No plays match this situation — try a different filter.":"This playbook is empty. Go to the Board, design a play, and save it here."}</p>}
              <button className="pb-btn pb-ghost" style={{width:"100%",marginTop:12}} onClick={()=>setView("board")}>← Back to the Board</button>
            </div>
          </div>); })()}

        {view==="crunch" && (
          <div className="pb-section">
            <div className="pb-card" style={{marginBottom:14}}>
              <p className="pb-label">Crunch Time — late-game play calling</p>
              <p className="pb-hint" style={{marginBottom:10}}>Set the clock and score situation and get a play built for that exact moment — for any sport.</p>
              <div style={{marginBottom:8}}><SportTabs/></div>
              <input className="pb-input" placeholder='Time / situation (e.g. "2:00 left, no timeouts" or "overtime, last 5 min")' value={crunch.time} onChange={e=>setCrunch(c=>({...c,time:e.target.value}))} style={{marginBottom:8}}/>
              <input className="pb-input" placeholder='Score (e.g. "down 3-2, bottom of the 8th" or "up 1, 2 min left")' value={crunch.sc} onChange={e=>setCrunch(c=>({...c,sc:e.target.value}))} style={{marginBottom:10}}/>
              <button className="pb-btn pb-acc" onClick={genCrunch} disabled={!!loading}>{loading==="crunch"?<><span className="pb-spin"/>Calling it…</>:"Recommend a play"}</button>
            </div>
            {error && <div className="pb-err" style={{marginBottom:14}}>{error}</div>}
            {crunch.res && (<div className="pb-card"><p className="pb-info-t">{crunch.res.name}</p><p className="pb-info-b" style={{marginBottom:12}}>{crunch.res.description}</p>
              <button className="pb-btn pb-off" onClick={loadCrunch}>Load onto the board</button></div>)}
          </div>
        )}

        {view==="counter" && (
          <div className="pb-section">
            <div className="pb-card" style={{marginBottom:14}}>
              <p className="pb-label">Counter a scheme</p>
              <p className="pb-hint" style={{marginBottom:10}}>Tell it what the opponent runs (e.g. "Cover 2", "2-3 zone", "high press") and get the counter + a play.</p>
              <div style={{marginBottom:8}}><SportTabs/></div>
              <div className="pb-row"><input className="pb-input" placeholder="What is the opponent running?" value={counter.q} onChange={e=>setCounter(c=>({...c,q:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&genCounter()}/>
                <button className="pb-btn pb-acc" style={{flex:"0 0 110px"}} onClick={genCounter} disabled={!!loading}>{loading==="counter"?<span className="pb-spin"/>:"Counter it"}</button></div>
            </div>
            {error && <div className="pb-err" style={{marginBottom:14}}>{error}</div>}
            {counter.res && (<div className="pb-card" style={{marginBottom:14}}><p className="pb-info-t">{counter.res.name}</p><p className="pb-info-b" style={{marginBottom:12}}>{counter.res.description}</p>
              <button className="pb-btn pb-off" onClick={loadCounter}>Load onto the board</button></div>)}
            <div className="pb-card">
              <p className="pb-label">{cfg.label} tips</p>
              {(TIPS[sport]||TIPS.custom).map((tip,i)=><div key={i} className="pb-tip">{tip}</div>)}
            </div>
          </div>
        )}

        {view==="playbooku" && (
          <div className="pb-section">
            <div className="pb-discl">Strategies is a learning library of <b>real, widely-used formations and strategies</b> that teams actually run, explained for study. It is general coaching knowledge — not any team's proprietary playbook or live statistics.</div>
            <div className="pb-card" style={{marginBottom:14}}>
              <p className="pb-label">Strategies — real schemes</p>
              <p className="pb-hint" style={{marginBottom:10}}>Pick a sport, read the concept, and load it onto your board to study or tweak it.</p>
              <SportTabs/>
            </div>
            {(PLAYBOOK_U[sport]||[]).map((e,i)=>(
              <div key={i} className="pb-card" style={{marginBottom:10}}>
                <p className="pb-info-t">{e.name}</p>
                <p className="pb-info-b" style={{marginBottom:12}}>{e.info}</p>
                <button className="pb-btn pb-off" onClick={()=>loadU(e)}>Load onto the board</button>
              </div>
            ))}
          </div>
        )}

        {view==="expert" && (
          <div className="pb-section">
            <div className="pb-discl">Expert mode plays are <b>AI-generated and original</b> — inspired by the style of professional play, but not real plays, data, or playbooks from any NFL, NBA, MLB, NHL, or other team or league.</div>
            <div className="pb-card" style={{marginBottom:14}}>
              <p className="pb-label">Expert — pro-style plays</p>
              <p className="pb-hint" style={{marginBottom:10}}>Generate a polished, professional-caliber {side} play for your sport.</p>
              <div style={{marginBottom:8}}><SportTabs/></div>
              <div className="pb-seg" style={{marginBottom:10}}>
                <button className={"pb-mb"+(side==="offense"?" on":"")} onClick={()=>setSide("offense")}>Offense</button>
                <button className={"pb-mb"+(side==="defense"?" on":"")} onClick={()=>setSide("defense")}>Defense</button>
              </div>
              <button className="pb-btn pb-acc" onClick={genExpert} disabled={!!loading}>{loading==="expert"?<><span className="pb-spin"/>Drawing it up…</>:`Generate pro-style ${side}`}</button>
            </div>
            {error && <div className="pb-err" style={{marginBottom:14}}>{error}</div>}
            {expert.res && (<div className="pb-card"><p className="pb-info-t">{expert.res.name}</p><p className="pb-info-b" style={{marginBottom:12}}>{expert.res.description}</p>
              <button className="pb-btn pb-off" onClick={loadExpert}>Load onto the board</button></div>)}
          </div>
        )}

        {view==="suggestions" && (
          <div className="pb-section">
            <div className="pb-card" style={{marginBottom:14,borderColor:"var(--acc)"}}>
              <p className="pb-label">💡 Help shape Playbook U</p>
              <p className="pb-hint" style={{marginBottom:12,lineHeight:1.55}}>Your voice matters here. I care about every coach and athlete's perspective — this app is built for <i>you</i>. What would make Playbook U a better experience? A feature you wish existed, a sport you want deeper, anything that's clunky — tell me and it goes straight onto the list.</p>
              {suggSent ? (
                <div className="pb-result" style={{marginBottom:0}}><b>Thank you. 🙌</b> Your suggestion is saved. It genuinely helps make this better for the next athlete who opens the app. <button className="pb-link" onClick={()=>setSuggSent(false)}>Leave another →</button></div>
              ) : (<>
                <input className="pb-input" style={{width:"100%",marginBottom:8}} placeholder="Your name or team (optional)" value={suggName} onChange={e=>setSuggName(e.target.value)}/>
                <textarea className="pb-input" style={{width:"100%",minHeight:96,resize:"vertical",marginBottom:10}} placeholder="What can I do to make this app better for you?" value={suggInput} onChange={e=>setSuggInput(e.target.value)}/>
                <button className="pb-btn pb-acc" style={{width:"100%"}} onClick={sendSuggestion}>Send my suggestion</button>
              </>)}
            </div>
            {suggs.length>0 && (
              <div className="pb-card">
                <p className="pb-label" style={{marginBottom:8}}>Suggestions you've shared ({suggs.length})</p>
                <div className="pb-lib" style={{maxHeight:"none"}}>{suggs.map(s=>(
                  <div key={s.id} className="pb-suggitem"><div style={{flex:1,minWidth:0}}><div style={{fontSize:13.5,lineHeight:1.45}}>{s.text}</div><div className="pb-mut" style={{marginTop:3}}>— {s.from} · {new Date(s.at).toLocaleDateString()}</div></div>
                    <button className="pb-mini x" onClick={()=>{ const next=suggs.filter(x=>x.id!==s.id); setSuggs(next); pSet(SUGG_KEY,next); }}>✕</button></div>))}</div>
                <p className="pb-hint" style={{marginTop:8,opacity:.7}}>Saved on this device for now. When the app's account sync is connected, your feedback will reach the developer directly.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showTokens && (
        <div className="pb-overlay" onClick={()=>setShowTokens(false)}>
          <div className="pb-modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"Bebas Neue",fontSize:30,letterSpacing:1,marginBottom:6}}>{remaining<=0?(trialExpired?"Your free trial ended":"Out of simulations"):"Upgrade your plan"}</div>
            <p className="pb-hint" style={{marginBottom:16}}>{trialExpired?"Your 1-day trial is up. Pick a plan to keep going.":remaining<=0?"You've used your simulations. Pick a plan to keep going.":"Pick a plan — keep simulating without limits."}</p>
            <div className="pb-tier" style={{borderColor:"var(--acc)"}}>
              <div style={{fontFamily:"Bebas Neue",fontSize:38,color:"var(--acc)",lineHeight:1}}>$9.99<small style={{fontSize:13}}> / month</small></div>
              <p className="pb-hint" style={{margin:"6px 0 12px"}}><b>Unlimited</b> — make and save unlimited plays, every sport and every feature. Cancel anytime.</p>
              <button className="pb-btn pb-acc" onClick={()=>choosePlan("unlimited")} disabled={plan==="unlimited"}>{plan==="unlimited"?"Current plan":"Subscribe — $9.99/mo"}</button>
            </div>
            <button className="pb-btn pb-ghost" style={{marginTop:12}} onClick={()=>setShowTokens(false)}>Not now</button>
          </div>
        </div>
      )}
      {shareOpen && (
        <div className="pb-overlay" onClick={()=>setShareOpen(false)}>
          <div className="pb-modal" onClick={e=>e.stopPropagation()} style={{textAlign:"left",maxWidth:400}}>
            <div style={{fontFamily:"Bebas Neue",fontSize:28,letterSpacing:1,marginBottom:4,textAlign:"center"}}>↗ Share this play</div>
            <p className="pb-hint" style={{marginBottom:12,textAlign:"center"}}>Anyone can open the link and watch the play — even without the app. To edit, animate, and build their own, they download Playbook U and subscribe.</p>
            <input ref={shareRef} className="pb-input pb-sharelink" readOnly value={shareLink} onFocus={e=>e.target.select()} onClick={e=>e.target.select()} style={{width:"100%",fontSize:12}}/>
            <div className="pb-row" style={{marginTop:10}}>
              <button className="pb-btn pb-acc" style={{flex:1}} onClick={copyShare}>📋 Copy link</button>
              <button className="pb-btn pb-ghost" style={{flex:1}} onClick={sysShare}>↗ Share…</button>
            </div>
            <p className="pb-label" style={{margin:"14px 0 6px"}}>Send it to a phone or email</p>
            <input className="pb-input" placeholder="Phone number or email address" value={shareTo} onChange={e=>setShareTo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendPlay()} style={{marginBottom:8}}/>
            <button className="pb-btn pb-acc" style={{width:"100%"}} onClick={sendPlay}>📤 Send the play</button>
            <p className="pb-fine" style={{marginTop:6}}>{sendReady ? "Delivered straight to their phone or tablet — send it to yourself to test it, then open it on your other device to watch it play." : "Opens your Messages or Mail with the play link ready to go. On your hosted site (with texting/email turned on) it sends automatically — see BACKEND.md."}</p>
            <p className="pb-label" style={{margin:"16px 0 6px"}}>Open a play someone sent you</p>
            <input className="pb-input" placeholder="Paste a link or play code" value={importCode} onChange={e=>setImportCode(e.target.value)} style={{marginBottom:8}}/>
            <button className="pb-btn pb-ghost" style={{width:"100%"}} onClick={doImport} disabled={!importCode.trim()}>▶ Load the play</button>
            <button className="pb-btn pb-ghost" style={{width:"100%",marginTop:14}} onClick={()=>setShareOpen(false)}>Done</button>
            <p className="pb-fine" style={{marginTop:10}}>The link carries the play itself, so it opens with no account needed. Auto-text delivery, your own short web links, and live co-viewing turn on with the hosted launch (see LAUNCH.md).</p>
          </div>
        </div>
      )}
      {toast && <div className="pb-toast">{toast}</div>}
    </div>
  );
}

export default function PlaybookAI(){ return (<ErrorBoundary><PlaybookAIInner/></ErrorBoundary>); }
