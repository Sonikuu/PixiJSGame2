class TileData 
{
  constructor(index, bg)
  {
    this.index = index
    this.bg = bg
    this.fg = 0
  }
}

class Tilemap
{
  constructor(w, h)
  {
    this.w = w
    this.h = h
    this.tiles = Array(w * h)
    i = 0
    this.tiles.fill(TileData(i++, 0))
    this.tilesprs = Array(w * h)
  }
  createMapSprites()
  {
    var cont = new PIXI.Container()
    for (var i = 0; i < this.tiles.length; i++) 
    {
      var nt = PIXI.Sprite.from(spritesheet.textures[tilenames[this.tiles[i]]])
      nt.x = i % this.w * 16
      nt.y = Math.floor(i / this.w) * 16
      nt.eventMode = 'static'
      nt.on('pointerup', (event) => {
        if(!tapmoved) {
          console.log('tapped ')
        } })
      cont.addChild(nt)
      this.tilesprs[i] = nt
    }
    
    
    gamemask.addChild(cont)
    return cont
  }
}

const app = new PIXI.Application();

const tilenames = ['blank', 'grass', 'wall', 'eh']
const tilesize = {w: 16, h: 16}
const sprsrc = {...tilesize, x: 0, y: 0}


// Initialize the application
await app.init({ background: '#101010', resizeTo: document.body });

// Append the application canvas to the document body
document.body.appendChild(app.canvas);

//Creating spritesheet data
const maxTiles = 4
var atlasData = {frames: {},
  meta: {image: '/Sprites/Tile.png',
    size: {w: 64, h: 64}
  }
}
for (var i = 0; i < maxTiles; i++) {
  atlasData.frames[tilenames[i]] = {frame : 
  {x: i % 4 * 16, 
  y: 16 * Math.floor(i / 4), 
  ...tilesize},
  
    sourceSize: tilesize,
    spriteSourceSize: sprsrc
  }
}

var pointerdown = false
var tapmoved = false
var gamemask = new PIXI.Container ()
gamemask.mask = new PIXI.Graphics().rect(0, 0, app.screen.width, app.screen.height - 400).fill(0xffffff)

gamemask.eventMode = 'static'
gamemask.on('pointerdown', (event) =>
 {pointerdown = true
   tapmoved = false})
gamemask.on('pointerup', (event) => 
    {pointerdown = false})
gamemask.on('pointerupoutside', (event) => 
    {pointerdown = false})
gamemask.on('globalpointermove', (event) => {if(pointerdown) 
    {targmap.x += event.movementX
     targmap.y += event.movementY
    if(Math.abs(event.movementX) + Math.abs(event.movementY) > 1)
      tapmoved = true
    }})
//app.stage.eventMode = 'static'
gamemask.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height)

app.stage.addChild(gamemask)


// Create the SpriteSheet from data and image
const texturePromise = PIXI.Assets.load('/Sprites/Tile.png');
await texturePromise
const spritesheet = new PIXI.Spritesheet(
	PIXI.Texture.from(atlasData.meta.image),
	atlasData
);

// Generate all the Textures asynchronously
await spritesheet.parse();

// spritesheet is ready to use!

var mainmap = new Tilemap(10, 10)
var targmap = mainmap.createMapSprites()
