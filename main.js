
const app = new PIXI.Application();

//Prevent rightclick menu
document.addEventListener('contextmenu', (event) =>
{
  event.preventDefault();
});

// Initialize the application
await app.init({ background: '#303030', resizeTo: document.body });

// Append the application canvas to the document body
document.body.appendChild(app.canvas);


if(app.screen.width > app.screen.height)
  gamemask.mask = new PIXI.Graphics().rect(0, 0, app.screen.width / 2, app.screen.height).fill(0xffffff)
else
  gamemask.mask = new PIXI.Graphics().rect(0, 0, app.screen.width, app.screen.height / 2).fill(0xffffff)

gamemask.eventMode = 'static'
gamemask.on('pointerdown', (event) =>
 {pointerdown = true
   tapmoved = false})
gamemask.on('pointerup', (event) => 
    {pointerdown = false})
gamemask.on('pointerupoutside', (event) => 
    {pointerdown = false})
gamemask.on('globalpointermove', (event) => {if(pointerdown){
  if(seltool == 0) //Move tool
  {
  targmap.x += event.movementX
     targmap.y += event.movementY
    if(Math.abs(event.movementX) + Math.abs(event.movementY) > 1)
      tapmoved = true
  } }})
//app.stage.eventMode = 'static'
gamemask.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height)




app.stage.addChild(gamemask)


// Create the SpriteSheet from data and image
const texturePromise = PIXI.Assets.load('./Sprites/Tile.png');
await texturePromise
const spritesheet = new PIXI.Spritesheet(
	PIXI.Texture.from(atlasData.meta.image),
	atlasData
);

// Generate all the Textures asynchronously
await spritesheet.parse();

// spritesheet is ready to use!

//this sucked, why did it take hours to figure out how to change the scaling mode???
spritesheet.textureSource.scaleMode = 'nearest'


var mainmap = new Tilemap(10, 10)
var targmap = mainmap.createMapSprites(spritesheet)
targmap.scale = 2

var toolbutton = PIXI.Sprite.from(spritesheet.textures['conveyorunknown'])
toolbutton.x = app.screen.width / 2 + 32
toolbutton.y = 32
toolbutton.scale = 4
toolbutton.eventMode = 'static'
toolbutton.on('pointerdown', (event => {
  if(seltool == 0) {seltool = 1; console.log("boop")} else {seltool = 0; console.log("beep")}}))
app.stage.addChild(toolbutton)