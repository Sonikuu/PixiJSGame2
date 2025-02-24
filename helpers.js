const tilenames = ['blank', 'floor', 'grass', 'conveyorcross',
  'conveyorend', 'conveyormerge', 'conveyormergef', 'conveyormerget',
  'conveyorsplit', 'conveyorsplitf', 'conveyorsplitt', 'conveyorstart',
  'conveyorstraight', 'conveyorturn', 'conveyorturnf', 'conveyorunknown'
]
const tilesize = { w: 16, h: 16 }
const sprsrc = { ...tilesize, x: 0, y: 0 }
const gamemask = new PIXI.Container ()

var pointerdown = false
var tapmoved = false
var seltool = 0
var zoomobj = {oldzoom: 1.0, targetzoom: 1.0, interpstep: 0.0, maxzoom: 4.0, minzoom: 0.25, interpolatezoom: function(){return (this.oldzoom * (1.0 - this.interpstep)) + (this.targetzoom * this.interpstep)}};
var placecontrols = {mousestart: {x: 0, y: 0}, lasttile: {x: 0, y: 0}, lastindex: 0}


//Creating spritesheet data
const maxTiles = 16
var atlasData = {frames: {},
  meta: {image: './Sprites/Tile.png',
    size: {w: 64, h: 64},
    
  }
}
for (var i = 0; i < maxTiles; i++) {
  atlasData.frames[tilenames[i]] = {frame : 
  {x: i % 4 * 16, 
  y: 16 * Math.floor(i / 4), 
  ...tilesize},
  
    sourceSize: tilesize,
    spriteSourceSize: sprsrc,
  }
}



class ConveyorData
{
  //0 = none, 1 = input, 2 = output
  constructor()
  {
    this.up = 0;
    this.down = 0;
    this.left = 0;
    this.right = 0;
  }
}

class TileData 
{
  constructor(index, bg)
  {
    this.index = index
    this.bg = bg
    this.fg = 0
    this.conv = new ConveyorData()
  }
}

class Tilemap
{
  constructor(w, h)
  {
    this.w = w
    this.h = h
    this.tiles = Array(w * h)
    this.tiles = this.tiles.fill(0).map((e, i) => (new TileData(i, 1)))
    this.tilesprs = Array(w * h)
    this.tilesprsfg = Array(w * h)
  }
  createMapSprites(spritesheet)
  {
    var cont = new PIXI.Container()
    for (var i = 0; i < this.tiles.length; i++) 
    {
      let nt = PIXI.Sprite.from(spritesheet.textures[tilenames[this.tiles[i].bg]])
      nt.x = i % this.w * 16
      nt.y = Math.floor(i / this.w) * 16
      nt.anchor.set(0.5)
      nt.eventMode = 'static'
      nt.tiledata = this.tiles[i]
      nt.on('pointerup', tilePointerUp(nt, spritesheet))//Anonymous functions in here can be messy, changed to this
      nt.on('pointermove', tilePointerMove(nt, spritesheet))
      nt.on('pointerdown', tilePointerDown(nt))
      //console.log(nt)
      cont.addChild(nt)
      this.tilesprs[i] = nt
      nt.tilemap = this
      nt.z = 5

      let ntfg = PIXI.Sprite.from(spritesheet.textures[tilenames[this.tiles[i].fg]])
      ntfg.x = i % this.w * 16
      ntfg.y = Math.floor(i / this.w) * 16
      ntfg.anchor.set(0.5)
      ntfg.eventMode = 'none'
      cont.addChild(ntfg)
      this.tilesprsfg[i] = ntfg
      ntfg.z = 10
      nt.fg = ntfg//we cant have ntfg as a child because it's "depreciated"
      //but nobody said I cant do this :)
    }
  
    
    
    gamemask.addChild(cont)
    return cont
  }
  getPosFromIndex(index)
  {
    return { x: index % this.w, y: Math.floor(index / this.w) }
  }
}

function tilePointerUp(nt, spritesheet) 
{
  return (event) =>
  {
    if (!tapmoved) 
    {
      //nt.tiledata.bg += 1;
     // nt.texture = spritesheet.textures[tilenames[nt.tiledata.bg]]
    }
  }
}

function tilePointerDown(nt) 
{
  return (event) =>
  {
    //if (!tapmoved) 
    {
      placecontrols.mousestart = nt.tilemap.getPosFromIndex(nt.tiledata.index)
      placecontrols.lasttile = placecontrols.mousestart
      placecontrols.lastindex = nt.tiledata.index
      console.log("tdown")
    }
  }
}


function tilePointerMove(nt, spritesheet) 
{
  return (event) =>
  {
    if(seltool == 1 && pointerdown && placecontrols.lastindex != nt.tiledata.index)
    {
      tpos = nt.tilemap.getPosFromIndex(nt.tiledata.index)
      
      if (tpos.x > placecontrols.lasttile.x)
      {
        nt.tilemap.tiles[placecontrols.lastindex].conv.right = 2;
        nt.tiledata.conv.left = 1;
      }
      else if (tpos.x < placecontrols.lasttile.x)
      {
        nt.tilemap.tiles[placecontrols.lastindex].conv.left = 2;
        nt.tiledata.conv.right = 1;
      }
      else if (tpos.y > placecontrols.lasttile.y)
      {
        nt.tilemap.tiles[placecontrols.lastindex].conv.down = 2;
        nt.tiledata.conv.up = 1;
      }
      else if (tpos.y < placecontrols.lasttile.y)
      {
        nt.tilemap.tiles[placecontrols.lastindex].conv.up = 2;
        nt.tiledata.conv.down = 1;
      }
      
      let newtile = determineConveyorTex(nt.tiledata);
      nt.fg.texture = spritesheet.textures[newtile.newtex]
      nt.fg.angle = newtile.newrot * 90
      newtile = determineConveyorTex(nt.tilemap.tiles[placecontrols.lastindex]);
      nt.tilemap.tilesprsfg[placecontrols.lastindex].texture = spritesheet.textures[newtile.newtex]
      nt.tilemap.tilesprsfg[placecontrols.lastindex].angle = newtile.newrot * 90
      placecontrols.lasttile = tpos
      placecontrols.lastindex = nt.tiledata.index
    }
  }
}

function determineConveyorTex(tiledata)
{
    let thisconv = tiledata.conv;
    //Trash code incoming
    let incount = 0;
    let outcount = 0;
    let lastin = -1;//0 = up, 1 = right, 2 = down, 3 = left
    let lastout = -1;
    let newtex = 'conveyorunknown';
    let newrot = 0;
    let flip = false;
    //Input checking
    if(thisconv.up == 1)
    {
        incount++;
        lastin = 0;
    }
    if(thisconv.down == 1)
    {
        incount++;
        lastin = 2;
    }
    if(thisconv.left == 1)
    {
        incount++;
        lastin = 3;
    }
    if(thisconv.right == 1)
    {
        incount++;
        lastin = 1;
    }

    //Output checking
    if(thisconv.up == 2)
    {
        outcount++;
        lastout = 0;
    }
    if(thisconv.down == 2)
    {
        outcount++;
        lastout = 2;
    }
    if(thisconv.left == 2)
    {
        outcount++;
        lastout = 3;
    }
    if(thisconv.right == 2)
    {
        outcount++;
        lastout = 1;
    }
    
    if(incount == 1 && outcount == 0)//End
    {
        newtex = 'conveyorend';
        newrot = lastin;    //Sidenote, sprite is flipped compared to all others, just makes it easier for me
    }
    else if(incount == 0 && outcount == 1)//Start
    {
        newtex = 'conveyorstart';
        newrot = lastout;
    }
    else if(incount == 1 && outcount == 1)//1 to 1
    {
        if(((lastout == 0 || lastin == 0) && (lastin == 2 || lastout == 2))//Straight ahead check
        || ((lastout == 1 || lastin == 1) && (lastin == 3 || lastout == 3)))//Being specific doesnt matter much for this check
        {
            newtex = 'conveyorstraight';
            newrot = lastout;
        }
        else //Must be a turn
        {
            newtex = 'conveyorturn';
            newrot = lastout;
            if((lastout < lastin && !(lastin == 3 && lastout == 0)) || (lastin == 0 && lastout == 3))
                newtex = 'conveyorturnf';
        }

    }
    else if(incount == 2 && outcount == 1)//Merge
    {
        newtex = 'conveyormerge';
        newrot = lastout;
        //poopcode incoming
        if((lastout == 0 && thisconv.right == 1) ||
        (lastout == 1 && thisconv.down == 1) ||
        (lastout == 2 && thisconv.left == 1) ||
        (lastout == 3 && thisconv.up == 1))
            newtex = 'conveyormergef';
        if((lastin == 0 && thisconv.down == 1) ||
        (lastin == 1 && thisconv.left == 1) ||
        (lastin == 2 && thisconv.up == 1) ||
        (lastin == 3 && thisconv.right == 1))
            newtex = 'conveyormerget';
    }
    else if(incount == 2 && outcount == 2)//Crossover
    {
        newtex = 'conveyorcross';
        if(lastout == 1 && thisconv.down == 2)
            newrot = 1;
        else if(lastout == 3 && thisconv.down == 2)
            newrot = 2;
        else if(lastout == 3 && thisconv.up == 2)
            newrot = 3;
    }
    else if(incount == 1 && outcount == 2)//Splitter
    {//Im tired so the code for this one is especially bad
        newrot = (lastin + 2) % 4;
        newtex = 'conveyorsplitt';
        if((lastout == 1 && thisconv.up == 2) ||
        (lastout == 3 && thisconv.down == 2))
        {
            if(lastin == 1 || lastin == 3)
                newtex = 'conveyorsplit';
            else
                newtex = 'conveyorsplitf';
        }
        else if((lastout == 1 && thisconv.down == 2) ||
        (lastout == 3 && thisconv.up == 2))
        {
            if(lastin == 1 || lastin == 3)
                newtex = 'conveyorsplitf';
            else
                newtex = 'conveyorsplit';
        }
    }

    return {'newtex': newtex, 'newrot': newrot};
}

