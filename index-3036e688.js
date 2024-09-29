// LittleJS - MIT License - Copyright 2021 Frank Force

/** Size to render debug points by default
 *  @type {Number}
 *  @default
 *  @memberof Debug */
const debugPointSize = .5;

/** True if watermark with FPS should be shown, false in release builds
 *  @type {Boolean}
 *  @default
 *  @memberof Debug */
let showWatermark = true;

/** Key code used to toggle debug mode, Esc by default
 *  @type {String}
 *  @default
 *  @memberof Debug */
let debugKey = 'Escape';

/** True if the debug overlay is active, always false in release builds
 *  @type {Boolean}
 *  @default
 *  @memberof Debug */
let debugOverlay = false;

// Engine internal variables not exposed to documentation
let debugPrimitives = [], debugPhysics = false, debugRaycast = false, debugParticles = false, debugGamepads = false, debugTakeScreenshot, downloadLink;

///////////////////////////////////////////////////////////////////////////////
// Debug helper functions

/** Asserts if the expression is false, does not do anything in release builds
 *  @param {Boolean} assert
 *  @param {Object} [output]
 *  @memberof Debug */
function ASSERT(assert, output) 
{
    output ? console.assert(assert, output) : console.assert(assert);
}

/** Draw a debug rectangle in world space
 *  @param {Vector2} pos
 *  @param {Vector2} [size=Vector2()]
 *  @param {String}  [color]
 *  @param {Number}  [time]
 *  @param {Number}  [angle]
 *  @param {Boolean} [fill]
 *  @memberof Debug */
function debugRect(pos, size=vec2(), color='#fff', time=0, angle=0, fill=false)
{
    ASSERT(typeof color == 'string', 'pass in css color strings'); 
    debugPrimitives.push({pos, size:vec2(size), color, time:new Timer(time), angle, fill});
}

/** Draw a debug circle in world space
 *  @param {Vector2} pos
 *  @param {Number}  [radius]
 *  @param {String}  [color]
 *  @param {Number}  [time]
 *  @param {Boolean} [fill]
 *  @memberof Debug */
function debugCircle(pos, radius=0, color='#fff', time=0, fill=false)
{
    ASSERT(typeof color == 'string', 'pass in css color strings');
    debugPrimitives.push({pos, size:radius, color, time:new Timer(time), angle:0, fill});
}

/** Draw a debug point in world space
 *  @param {Vector2} pos
 *  @param {String}  [color]
 *  @param {Number}  [time]
 *  @param {Number}  [angle]
 *  @memberof Debug */
function debugPoint(pos, color, time, angle) {debugRect(pos, undefined, color, time, angle);}

/** Draw a debug line in world space
 *  @param {Vector2} posA
 *  @param {Vector2} posB
 *  @param {String}  [color]
 *  @param {Number}  [thickness]
 *  @param {Number}  [time]
 *  @memberof Debug */
function debugLine(posA, posB, color, thickness=.1, time)
{
    const halfDelta = vec2((posB.x - posA.x)/2, (posB.y - posA.y)/2);
    const size = vec2(thickness, halfDelta.length()*2);
    debugRect(posA.add(halfDelta), size, color, time, halfDelta.angle(), true);
}

/** Draw a debug axis aligned bounding box in world space
 *  @param {Vector2} pA - position A
 *  @param {Vector2} sA - size A
 *  @param {Vector2} pB - position B
 *  @param {Vector2} sB - size B
 *  @param {String}  [color]
 *  @memberof Debug */
function debugAABB(pA, sA, pB, sB, color)
{
    const minPos = vec2(min(pA.x - sA.x/2, pB.x - sB.x/2), min(pA.y - sA.y/2, pB.y - sB.y/2));
    const maxPos = vec2(max(pA.x + sA.x/2, pB.x + sB.x/2), max(pA.y + sA.y/2, pB.y + sB.y/2));
    debugRect(minPos.lerp(maxPos,.5), maxPos.subtract(minPos), color);
}

/** Draw a debug axis aligned bounding box in world space
 *  @param {String}  text
 *  @param {Vector2} pos
 *  @param {Number}  [size]
 *  @param {String}  [color]
 *  @param {Number}  [time]
 *  @param {Number}  [angle]
 *  @param {String}  [font]
 *  @memberof Debug */
function debugText(text, pos, size=1, color='#fff', time=0, angle=0, font='monospace')
{
    ASSERT(typeof color == 'string', 'pass in css color strings');
    debugPrimitives.push({text, pos, size, color, time:new Timer(time), angle, font});
}

/** Save a canvas to disk 
 *  @param {HTMLCanvasElement} canvas
 *  @param {String}            [filename]
 *  @param {String}            [type]
 *  @memberof Debug */
function debugSaveCanvas(canvas, filename=engineName, type='image/png')
{ debugSaveDataURL(canvas.toDataURL(type), filename); }

/** Save a data url to disk 
 *  @param {String}     dataURL
 *  @param {String}     filename
 *  @memberof Debug */
function debugSaveDataURL(dataURL, filename)
{
    downloadLink.download = filename;
    downloadLink.href = dataURL;
    downloadLink.click();
}

///////////////////////////////////////////////////////////////////////////////
// Engine debug function (called automatically)

function debugInit()
{
    // create link for saving screenshots
    document.body.appendChild(downloadLink = document.createElement('a'));
    downloadLink.style.display = 'none';
}

function debugUpdate()
{

    if (keyWasPressed(debugKey)) // Esc
        debugOverlay = !debugOverlay;
    if (debugOverlay)
    {
        if (keyWasPressed('Digit0'))
            showWatermark = !showWatermark;
        if (keyWasPressed('Digit1'))
            debugPhysics = !debugPhysics, debugParticles = false;
        if (keyWasPressed('Digit2'))
            debugParticles = !debugParticles, debugPhysics = false;
        if (keyWasPressed('Digit3'))
            debugGamepads = !debugGamepads;
        if (keyWasPressed('Digit4'))
            debugRaycast = !debugRaycast;
        if (keyWasPressed('Digit5'))
            debugTakeScreenshot = 1;
    }
}

function debugRender()
{
    glCopyToContext(mainContext);

    if (debugTakeScreenshot)
    {
        // composite canvas
        glCopyToContext(mainContext, true);
        mainContext.drawImage(overlayCanvas, 0, 0);
        overlayCanvas.width |= 0;

        // remove alpha and save
        const w = mainCanvas.width, h = mainCanvas.height;
        overlayContext.fillRect(0,0,w,h);
        overlayContext.drawImage(mainCanvas, 0, 0);
        debugSaveCanvas(overlayCanvas);
        debugTakeScreenshot = 0;
    }

    if (debugGamepads && gamepadsEnable && navigator.getGamepads)
    {
        // gamepad debug display
        const gamepads = navigator.getGamepads();
        for (let i = gamepads.length; i--;)
        {
            const gamepad = gamepads[i];
            if (gamepad)
            {
                const stickScale = 1;
                const buttonScale = .2;
                const centerPos = cameraPos;
                const sticks = stickData[i];
                for (let j = sticks.length; j--;)
                {
                    const drawPos = centerPos.add(vec2(j*stickScale*2, i*stickScale*3));
                    const stickPos = drawPos.add(sticks[j].scale(stickScale));
                    debugCircle(drawPos, stickScale, '#fff7',0,true);
                    debugLine(drawPos, stickPos, '#f00');
                    debugPoint(stickPos, '#f00');
                }
                for (let j = gamepad.buttons.length; j--;)
                {
                    const drawPos = centerPos.add(vec2(j*buttonScale*2, i*stickScale*3-stickScale-buttonScale));
                    const pressed = gamepad.buttons[j].pressed;
                    debugCircle(drawPos, buttonScale, pressed ? '#f00' : '#fff7', 0, true);
                    debugText(''+j, drawPos, .2);
                }
            }
        }
    }

    if (debugOverlay)
    {
        const saveContext = mainContext;
        mainContext = overlayContext;
        
        // draw red rectangle around screen
        const cameraSize = getCameraSize();
        debugRect(cameraPos, cameraSize.subtract(vec2(.1)), '#f008');

        // mouse pick
        let bestDistance = Infinity, bestObject;
        for (const o of engineObjects)
        {
            if (o.canvas || o.destroyed)
                continue;
            if (!o.size.x || !o.size.y)
                continue;

            const distance = mousePos.distanceSquared(o.pos);
            if (distance < bestDistance)
            {
                bestDistance = distance;
                bestObject = o;
            }

            // show object info
            const size = vec2(max(o.size.x, .2), max(o.size.y, .2));
            const color1 = new Color(o.collideTiles?1:0, o.collideSolidObjects?1:0, o.isSolid?1:0, o.parent?.2:.5);
            const color2 = o.parent ? new Color(1,1,1,.5) : new Color(0,0,0,.8);
            drawRect(o.pos, size, color1, o.angle, false);
            drawRect(o.pos, size.scale(.8), color2, o.angle, false);
            o.parent && drawLine(o.pos, o.parent.pos, .1, new Color(0,0,1,.5), false);
        }
        
        if (bestObject)
        {
            const raycastHitPos = tileCollisionRaycast(bestObject.pos, mousePos);
            raycastHitPos && drawRect(raycastHitPos.floor().add(vec2(.5)), vec2(1), new Color(0,1,1,.3));
            drawRect(mousePos.floor().add(vec2(.5)), vec2(1), new Color(0,0,1,.5), 0, false);
            drawLine(mousePos, bestObject.pos, .1, raycastHitPos ? new Color(1,0,0,.5) : new Color(0,1,0,.5), false);

            const debugText = 'mouse pos = ' + mousePos + 
                '\nmouse collision = ' + getTileCollisionData(mousePos) + 
                '\n\n--- object info ---\n' +
                bestObject.toString();
            drawTextScreen(debugText, mousePosScreen, 24, new Color, .05, undefined, 'center', 'monospace');
        }

        glCopyToContext(mainContext = saveContext);
    }

    {
        // draw debug primitives
        overlayContext.lineWidth = 2;
        const pointSize = debugPointSize * cameraScale;
        debugPrimitives.forEach(p=>
        {
            overlayContext.save();

            // create canvas transform from world space to screen space
            const pos = worldToScreen(p.pos);
            overlayContext.translate(pos.x|0, pos.y|0);
            overlayContext.rotate(p.angle);
            overlayContext.fillStyle = overlayContext.strokeStyle = p.color;

            if (p.text != undefined)
            {
                overlayContext.font = p.size*cameraScale + 'px '+ p.font;
                overlayContext.textAlign = 'center';
                overlayContext.textBaseline = 'middle';
                overlayContext.fillText(p.text, 0, 0);
            }
            else if (p.size == 0 || p.size.x === 0 && p.size.y === 0 )
            {
                // point
                overlayContext.fillRect(-pointSize/2, -1, pointSize, 3);
                overlayContext.fillRect(-1, -pointSize/2, 3, pointSize);
            }
            else if (p.size.x != undefined)
            {
                // rect
                const w = p.size.x*cameraScale|0, h = p.size.y*cameraScale|0;
                p.fill && overlayContext.fillRect(-w/2|0, -h/2|0, w, h);
                overlayContext.strokeRect(-w/2|0, -h/2|0, w, h);
            }
            else
            {
                // circle
                overlayContext.beginPath();
                overlayContext.arc(0, 0, p.size*cameraScale, 0, 9);
                p.fill && overlayContext.fill();
                overlayContext.stroke();
            }
            
            overlayContext.restore();
        });

        // remove expired primitives
        debugPrimitives = debugPrimitives.filter(r=>r.time<0);
    }

    {
        // draw debug overlay
        overlayContext.save();
        overlayContext.fillStyle = '#fff';
        overlayContext.textAlign = 'left';
        overlayContext.textBaseline = 'top';
        overlayContext.font = '28px monospace';
        overlayContext.shadowColor = '#000';
        overlayContext.shadowBlur = 9;

        let x = 9, y = -20, h = 30;
        if (debugOverlay)
        {
            overlayContext.fillText(engineName, x, y += h);
            overlayContext.fillText('Objects: ' + engineObjects.length, x, y += h);
            overlayContext.fillText('Time: ' + formatTime(time), x, y += h);
            overlayContext.fillText('---------', x, y += h);
            overlayContext.fillStyle = '#f00';
            overlayContext.fillText('ESC: Debug Overlay', x, y += h);
            overlayContext.fillStyle = debugPhysics ? '#f00' : '#fff';
            overlayContext.fillText('1: Debug Physics', x, y += h);
            overlayContext.fillStyle = debugParticles ? '#f00' : '#fff';
            overlayContext.fillText('2: Debug Particles', x, y += h);
            overlayContext.fillStyle = debugGamepads ? '#f00' : '#fff';
            overlayContext.fillText('3: Debug Gamepads', x, y += h);
            overlayContext.fillStyle = debugRaycast ? '#f00' : '#fff';
            overlayContext.fillText('4: Debug Raycasts', x, y += h);
            overlayContext.fillStyle = '#fff';
            overlayContext.fillText('5: Save Screenshot', x, y += h);

            let keysPressed = '';
            for(const i in inputData[0])
            {
                if (keyIsDown(i, 0))
                    keysPressed += i + ' ' ;
            }
            keysPressed && overlayContext.fillText('Keys Down: ' + keysPressed, x, y += h);

            let buttonsPressed = '';
            if (inputData[1])
            for(const i in inputData[1])
            {
                if (keyIsDown(i, 1))
                    buttonsPressed += i + ' ' ;
            }
            buttonsPressed && overlayContext.fillText('Gamepad: ' + buttonsPressed, x, y += h);
        }
        else
        {
            overlayContext.fillText(debugPhysics ? 'Debug Physics' : '', x, y += h);
            overlayContext.fillText(debugParticles ? 'Debug Particles' : '', x, y += h);
            overlayContext.fillText(debugRaycast ? 'Debug Raycasts' : '', x, y += h);
            overlayContext.fillText(debugGamepads ? 'Debug Gamepads' : '', x, y += h);
        }
    
        overlayContext.restore();
    }
}
/**
 * LittleJS Utility Classes and Functions
 * - General purpose math library
 * - Vector2 - fast, simple, easy 2D vector class
 * - Color - holds a rgba color with some math functions
 * - Timer - tracks time automatically
 * - RandomGenerator - seeded random number generator
 * @namespace Utilities
 */



/** A shortcut to get Math.PI
 *  @type {Number}
 *  @default Math.PI
 *  @memberof Utilities */
const PI = Math.PI;

/** Returns absoulte value of value passed in
 *  @param {Number} value
 *  @return {Number}
 *  @memberof Utilities */
function abs(value) { return Math.abs(value); }

/** Returns lowest of two values passed in
 *  @param {Number} valueA
 *  @param {Number} valueB
 *  @return {Number}
 *  @memberof Utilities */
function min(valueA, valueB) { return Math.min(valueA, valueB); }

/** Returns highest of two values passed in
 *  @param {Number} valueA
 *  @param {Number} valueB
 *  @return {Number}
 *  @memberof Utilities */
function max(valueA, valueB) { return Math.max(valueA, valueB); }

/** Returns the sign of value passed in
 *  @param {Number} value
 *  @return {Number}
 *  @memberof Utilities */
function sign(value) { return Math.sign(value); }

/** Returns first parm modulo the second param, but adjusted so negative numbers work as expected
 *  @param {Number} dividend
 *  @param {Number} [divisor]
 *  @return {Number}
 *  @memberof Utilities */
function mod(dividend, divisor=1) { return ((dividend % divisor) + divisor) % divisor; }

/** Clamps the value beween max and min
 *  @param {Number} value
 *  @param {Number} [min]
 *  @param {Number} [max]
 *  @return {Number}
 *  @memberof Utilities */
function clamp(value, min=0, max=1) { return value < min ? min : value > max ? max : value; }

/** Returns what percentage the value is between valueA and valueB
 *  @param {Number} value
 *  @param {Number} valueA
 *  @param {Number} valueB
 *  @return {Number}
 *  @memberof Utilities */
function percent(value, valueA, valueB)
{ return valueB-valueA ? clamp((value-valueA) / (valueB-valueA)) : 0; }

/** Linearly interpolates between values passed in using percent
 *  @param {Number} percent
 *  @param {Number} valueA
 *  @param {Number} valueB
 *  @return {Number}
 *  @memberof Utilities */
function lerp(percent, valueA, valueB) { return valueA + clamp(percent) * (valueB-valueA); }

/** Returns signed wrapped distance between the two values passed in
 *  @param {Number} valueA
 *  @param {Number} valueB
 *  @param {Number} [wrapSize]
 *  @returns {Number}
 *  @memberof Utilities */
function distanceWrap(valueA, valueB, wrapSize=1)
{ const d = (valueA - valueB) % wrapSize; return d*2 % wrapSize - d; }

/** Linearly interpolates between values passed in with wrapping
 *  @param {Number} percent
 *  @param {Number} valueA
 *  @param {Number} valueB
 *  @param {Number} [wrapSize]
 *  @returns {Number}
 *  @memberof Utilities */
function lerpWrap(percent, valueA, valueB, wrapSize=1)
{ return valueB + clamp(percent) * distanceWrap(valueA, valueB, wrapSize); }

/** Linearly interpolates between the angles passed in with wrapping
 *  @param {Number} percent
 *  @param {Number} angleA
 *  @param {Number} angleB
 *  @returns {Number}
 *  @memberof Utilities */
function lerpAngle(percent, angleA, angleB) { return lerpWrap(percent, angleA, angleB, 2*PI); }

/** Returns true if two axis aligned bounding boxes are overlapping 
 *  @param {Vector2} posA          - Center of box A
 *  @param {Vector2} sizeA         - Size of box A
 *  @param {Vector2} posB          - Center of box B
 *  @param {Vector2} [sizeB=(0,0)] - Size of box B, a point if undefined
 *  @return {Boolean}              - True if overlapping
 *  @memberof Utilities */
function isOverlapping(posA, sizeA, posB, sizeB=vec2())
{ 
    return abs(posA.x - posB.x)*2 < sizeA.x + sizeB.x 
        && abs(posA.y - posB.y)*2 < sizeA.y + sizeB.y;
}

/** Formats seconds to mm:ss style for display purposes 
 *  @param {Number} t - time in seconds
 *  @return {String}
 *  @memberof Utilities */
function formatTime(t) { return (t/60|0) + ':' + (t%60<10?'0':'') + (t%60|0); }

///////////////////////////////////////////////////////////////////////////////

/** Random global functions
 *  @namespace Random */

/** Returns a random value between the two values passed in
 *  @param {Number} [valueA]
 *  @param {Number} [valueB]
 *  @return {Number}
 *  @memberof Random */
function rand(valueA=1, valueB=0) { return valueB + Math.random() * (valueA-valueB); }

/** Returns a floored random value the two values passed in
 *  @param {Number} valueA
 *  @param {Number} [valueB]
 *  @return {Number}
 *  @memberof Random */
function randInt(valueA, valueB=0) { return Math.floor(rand(valueA,valueB)); }

/** Randomly returns either -1 or 1
 *  @return {Number}
 *  @memberof Random */
function randSign() { return randInt(2) * 2 - 1; }

/** Returns a random Vector2 with the passed in length
 *  @param {Number} [length]
 *  @return {Vector2}
 *  @memberof Random */
function randVector(length=1) { return new Vector2().setAngle(rand(2*PI), length); }

/** Returns a random Vector2 within a circular shape
 *  @param {Number} [radius]
 *  @param {Number} [minRadius]
 *  @return {Vector2}
 *  @memberof Random */
function randInCircle(radius=1, minRadius=0)
{ return radius > 0 ? randVector(radius * rand(minRadius / radius, 1)**.5) : new Vector2; }

/** Returns a random color between the two passed in colors, combine components if linear
 *  @param {Color}   [colorA=(1,1,1,1)]
 *  @param {Color}   [colorB=(0,0,0,1)]
 *  @param {Boolean} [linear]
 *  @return {Color}
 *  @memberof Random */
function randColor(colorA=new Color, colorB=new Color(0,0,0,1), linear=false)
{
    return linear ? colorA.lerp(colorB, rand()) : 
        new Color(rand(colorA.r,colorB.r), rand(colorA.g,colorB.g), rand(colorA.b,colorB.b), rand(colorA.a,colorB.a));
}

///////////////////////////////////////////////////////////////////////////////

/** 
 * Seeded random number generator
 * - Can be used to create a deterministic random number sequence
 * @example
 * let r = new RandomGenerator(123); // random number generator with seed 123
 * let a = r.float();                // random value between 0 and 1
 * let b = r.int(10);                // random integer between 0 and 9
 * r.seed = 123;                     // reset the seed
 * let c = r.float();                // the same value as a
 */
class RandomGenerator
{
    /** Create a random number generator with the seed passed in
     *  @param {Number} seed - Starting seed */
    constructor(seed)
    {
        /** @property {Number} - random seed */
        this.seed = seed;
    }

    /** Returns a seeded random value between the two values passed in
    *  @param {Number} [valueA]
    *  @param {Number} [valueB]
    *  @return {Number} */
    float(valueA=1, valueB=0)
    {
        // xorshift algorithm
        this.seed ^= this.seed << 13; 
        this.seed ^= this.seed >>> 17; 
        this.seed ^= this.seed << 5;
        return valueB + (valueA - valueB) * abs(this.seed % 1e9) / 1e9;
    }

    /** Returns a floored seeded random value the two values passed in
    *  @param {Number} valueA
    *  @param {Number} [valueB]
    *  @return {Number} */
    int(valueA, valueB=0) { return Math.floor(this.float(valueA, valueB)); }

    /** Randomly returns either -1 or 1 deterministically
    *  @return {Number} */
    sign() { return this.int(2) * 2 - 1; }
}

///////////////////////////////////////////////////////////////////////////////

/** 
 * Create a 2d vector, can take another Vector2 to copy, 2 scalars, or 1 scalar
 * @param {(Number|Vector2)} [x]
 * @param {Number} [y]
 * @return {Vector2}
 * @example
 * let a = vec2(0, 1); // vector with coordinates (0, 1)
 * let b = vec2(a);    // copy a into b
 * a = vec2(5);        // set a to (5, 5)
 * b = vec2();         // set b to (0, 0)
 * @memberof Utilities
 */
function vec2(x=0, y)
{
    return typeof x === 'number' ? 
        new Vector2(x, y == undefined? x : y) : 
        new Vector2(x.x, x.y);
}

/** 
 * Check if object is a valid Vector2
 * @param {any} v
 * @return {Boolean}
 * @memberof Utilities
 */
function isVector2(v) { return v instanceof Vector2; }

/** 
 * 2D Vector object with vector math library
 * - Functions do not change this so they can be chained together
 * @example
 * let a = new Vector2(2, 3); // vector with coordinates (2, 3)
 * let b = new Vector2;       // vector with coordinates (0, 0)
 * let c = vec2(4, 2);        // use the vec2 function to make a Vector2
 * let d = a.add(b).scale(5); // operators can be chained
 */
class Vector2
{
    /** Create a 2D vector with the x and y passed in, can also be created with vec2()
     *  @param {Number} [x] - X axis location
     *  @param {Number} [y] - Y axis location */
    constructor(x=0, y=0)
    {
        /** @property {Number} - X axis location */
        this.x = x;
        /** @property {Number} - Y axis location */
        this.y = y;
    }

    /** Returns a new vector that is a copy of this
     *  @return {Vector2} */
    copy() { return new Vector2(this.x, this.y); }

    /** Returns a copy of this vector plus the vector passed in
     *  @param {Vector2} v - other vector
     *  @return {Vector2} */
    add(v)
    {
        ASSERT(isVector2(v));
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    /** Returns a copy of this vector minus the vector passed in
     *  @param {Vector2} v - other vector
     *  @return {Vector2} */
    subtract(v)
    {
        ASSERT(isVector2(v));
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    /** Returns a copy of this vector times the vector passed in
     *  @param {Vector2} v - other vector
     *  @return {Vector2} */
    multiply(v)
    {
        ASSERT(isVector2(v));
        return new Vector2(this.x * v.x, this.y * v.y);
    }

    /** Returns a copy of this vector divided by the vector passed in
     *  @param {Vector2} v - other vector
     *  @return {Vector2} */
    divide(v)
    {
        ASSERT(isVector2(v));
        return new Vector2(this.x / v.x, this.y / v.y);
    }

    /** Returns a copy of this vector scaled by the vector passed in
     *  @param {Number} s - scale
     *  @return {Vector2} */
    scale(s)
    {
        ASSERT(!isVector2(s));
        return new Vector2(this.x * s, this.y * s);
    }

    /** Returns the length of this vector
     * @return {Number} */
    length() { return this.lengthSquared()**.5; }

    /** Returns the length of this vector squared
     * @return {Number} */
    lengthSquared() { return this.x**2 + this.y**2; }

    /** Returns the distance from this vector to vector passed in
     * @param {Vector2} v - other vector
     * @return {Number} */
    distance(v)
    {
        ASSERT(isVector2(v));
        return this.distanceSquared(v)**.5;
    }

    /** Returns the distance squared from this vector to vector passed in
     * @param {Vector2} v - other vector
     * @return {Number} */
    distanceSquared(v)
    {
        ASSERT(isVector2(v));
        return (this.x - v.x)**2 + (this.y - v.y)**2;
    }

    /** Returns a new vector in same direction as this one with the length passed in
     * @param {Number} [length]
     * @return {Vector2} */
    normalize(length=1)
    {
        const l = this.length();
        return l ? this.scale(length/l) : new Vector2(0, length);
    }

    /** Returns a new vector clamped to length passed in
     * @param {Number} [length]
     * @return {Vector2} */
    clampLength(length=1)
    {
        const l = this.length();
        return l > length ? this.scale(length/l) : this;
    }

    /** Returns the dot product of this and the vector passed in
     * @param {Vector2} v - other vector
     * @return {Number} */
    dot(v)
    {
        ASSERT(isVector2(v));
        return this.x*v.x + this.y*v.y;
    }

    /** Returns the cross product of this and the vector passed in
     * @param {Vector2} v - other vector
     * @return {Number} */
    cross(v)
    {
        ASSERT(isVector2(v));
        return this.x*v.y - this.y*v.x;
    }

    /** Returns the angle of this vector, up is angle 0
     * @return {Number} */
    angle() { return Math.atan2(this.x, this.y); }

    /** Sets this vector with angle and length passed in
     * @param {Number} [angle]
     * @param {Number} [length]
     * @return {Vector2} */
    setAngle(angle=0, length=1) 
    {
        this.x = length*Math.sin(angle);
        this.y = length*Math.cos(angle);
        return this;
    }

    /** Returns copy of this vector rotated by the angle passed in
     * @param {Number} angle
     * @return {Vector2} */
    rotate(angle)
    { 
        const c = Math.cos(angle), s = Math.sin(angle); 
        return new Vector2(this.x*c - this.y*s, this.x*s + this.y*c);
    }

    /** Set the integer direction of this vector, corrosponding to multiples of 90 degree rotation (0-3)
     * @param {Number} [direction]
     * @param {Number} [length] */
    setDirection(direction, length=1)
    {
        ASSERT(direction==0 || direction==1 || direction==2 || direction==3);
        return vec2(direction%2 ? direction-1 ? -length : length : 0, 
            direction%2 ? 0 : direction ? -length : length);
    }

    /** Returns the integer direction of this vector, corrosponding to multiples of 90 degree rotation (0-3)
     * @return {Number} */
    direction()
    { return abs(this.x) > abs(this.y) ? this.x < 0 ? 3 : 1 : this.y < 0 ? 2 : 0; }

    /** Returns a copy of this vector that has been inverted
     * @return {Vector2} */
    invert() { return new Vector2(this.y, -this.x); }

    /** Returns a copy of this vector with each axis floored
     * @return {Vector2} */
    floor() { return new Vector2(Math.floor(this.x), Math.floor(this.y)); }

    /** Returns the area this vector covers as a rectangle
     * @return {Number} */
    area() { return abs(this.x * this.y); }

    /** Returns a new vector that is p percent between this and the vector passed in
     * @param {Vector2} v - other vector
     * @param {Number}  percent
     * @return {Vector2} */
    lerp(v, percent)
    {
        ASSERT(isVector2(v));
        return this.add(v.subtract(this).scale(clamp(percent)));
    }

    /** Returns true if this vector is within the bounds of an array size passed in
     * @param {Vector2} arraySize
     * @return {Boolean} */
    arrayCheck(arraySize)
    {
        ASSERT(isVector2(arraySize));
        return this.x >= 0 && this.y >= 0 && this.x < arraySize.x && this.y < arraySize.y;
    }

    /** Returns this vector expressed as a string
     * @param {Number} digits - precision to display
     * @return {String} */
    toString(digits=3) 
    {
        return `(${(this.x<0?'':' ') + this.x.toFixed(digits)},${(this.y<0?'':' ') + this.y.toFixed(digits)} )`;
    }
}

///////////////////////////////////////////////////////////////////////////////

/** 
 * Create a color object with RGBA values, white by default
 * @param {Number} [r=1] - red
 * @param {Number} [g=1] - green
 * @param {Number} [b=1] - blue
 * @param {Number} [a=1] - alpha
 * @return {Color}
 * @memberof Utilities
 */
function rgb(r, g, b, a) { return new Color(r, g, b, a); }

/** 
 * Create a color object with HSLA values, white by default
 * @param {Number} [h=0] - hue
 * @param {Number} [s=0] - saturation
 * @param {Number} [l=1] - lightness
 * @param {Number} [a=1] - alpha
 * @return {Color}
 * @memberof Utilities
 */
function hsl(h, s, l, a) { return new Color().setHSLA(h, s, l, a); }

/** 
 * Check if object is a valid Color
 * @param {any} c
 * @return {Boolean}
 * @memberof Utilities
 */
function isColor(c) { return c instanceof Color; }

/** 
 * Color object (red, green, blue, alpha) with some helpful functions
 * @example
 * let a = new Color;              // white
 * let b = new Color(1, 0, 0);     // red
 * let c = new Color(0, 0, 0, 0);  // transparent black
 * let d = rgb(0, 0, 1);           // blue using rgb color
 * let e = hsl(.3, 1, .5);         // green using hsl color
 */
class Color
{
    /** Create a color with the rgba components passed in, white by default
     *  @param {Number} [r] - red
     *  @param {Number} [g] - green
     *  @param {Number} [b] - blue
     *  @param {Number} [a] - alpha*/
    constructor(r=1, g=1, b=1, a=1)
    {
        /** @property {Number} - Red */
        this.r = r;
        /** @property {Number} - Green */
        this.g = g;
        /** @property {Number} - Blue */
        this.b = b;
        /** @property {Number} - Alpha */
        this.a = a;
    }

    /** Returns a new color that is a copy of this
     * @return {Color} */
    copy() { return new Color(this.r, this.g, this.b, this.a); }

    /** Returns a copy of this color plus the color passed in
     * @param {Color} c - other color
     * @return {Color} */
    add(c)
    {
        ASSERT(isColor(c));
        return new Color(this.r+c.r, this.g+c.g, this.b+c.b, this.a+c.a);
    }

    /** Returns a copy of this color minus the color passed in
     * @param {Color} c - other color
     * @return {Color} */
    subtract(c)
    {
        ASSERT(isColor(c));
        return new Color(this.r-c.r, this.g-c.g, this.b-c.b, this.a-c.a);
    }

    /** Returns a copy of this color times the color passed in
     * @param {Color} c - other color
     * @return {Color} */
    multiply(c)
    {
        ASSERT(isColor(c));
        return new Color(this.r*c.r, this.g*c.g, this.b*c.b, this.a*c.a);
    }

    /** Returns a copy of this color divided by the color passed in
     * @param {Color} c - other color
     * @return {Color} */
    divide(c)
    {
        ASSERT(isColor(c));
        return new Color(this.r/c.r, this.g/c.g, this.b/c.b, this.a/c.a);
    }

    /** Returns a copy of this color scaled by the value passed in, alpha can be scaled separately
     * @param {Number} scale
     * @param {Number} [alphaScale=scale]
     * @return {Color} */
    scale(scale, alphaScale=scale) 
    { return new Color(this.r*scale, this.g*scale, this.b*scale, this.a*alphaScale); }

    /** Returns a copy of this color clamped to the valid range between 0 and 1
     * @return {Color} */
    clamp() { return new Color(clamp(this.r), clamp(this.g), clamp(this.b), clamp(this.a)); }

    /** Returns a new color that is p percent between this and the color passed in
     * @param {Color}  c - other color
     * @param {Number} percent
     * @return {Color} */
    lerp(c, percent)
    {
        ASSERT(isColor(c));
        return this.add(c.subtract(this).scale(clamp(percent)));
    }

    /** Sets this color given a hue, saturation, lightness, and alpha
     * @param {Number} [h] - hue
     * @param {Number} [s] - saturation
     * @param {Number} [l] - lightness
     * @param {Number} [a] - alpha
     * @return {Color} */
    setHSLA(h=0, s=0, l=1, a=1)
    {
        const q = l < .5 ? l*(1+s) : l+s-l*s, p = 2*l-q,
            f = (p, q, t)=>
                (t = ((t%1)+1)%1) < 1/6 ? p+(q-p)*6*t :
                t < 1/2 ? q :
                t < 2/3 ? p+(q-p)*(2/3-t)*6 : p;
                
        this.r = f(p, q, h + 1/3);
        this.g = f(p, q, h);
        this.b = f(p, q, h - 1/3);
        this.a = a;
        return this;
    }

    /** Returns this color expressed in hsla format
     * @return {Array} */
    HSLA()
    {
        const r = clamp(this.r);
        const g = clamp(this.g);
        const b = clamp(this.b);
        const a = clamp(this.a);
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        
        let h = 0, s = 0;
        if (max != min)
        {
            let d = max - min;
            s = l > .5 ? d / (2 - max - min) : d / (max + min);
            if (r == max)
                h = (g - b) / d + (g < b ? 6 : 0);
            else if (g == max)
                h = (b - r) / d + 2;
            else if (b == max)
                h =  (r - g) / d + 4;
        }

        return [h / 6, s, l, a];
    }

    /** Returns a new color that has each component randomly adjusted
     * @param {Number} [amount]
     * @param {Number} [alphaAmount]
     * @return {Color} */
    mutate(amount=.05, alphaAmount=0) 
    {
        return new Color
        (
            this.r + rand(amount, -amount),
            this.g + rand(amount, -amount),
            this.b + rand(amount, -amount),
            this.a + rand(alphaAmount, -alphaAmount)
        ).clamp();
    }

    /** Returns this color expressed as a hex color code
     * @param {Boolean} [useAlpha] - if alpha should be included in result
     * @return {String} */
    toString(useAlpha = true)      
    { 
        const toHex = (c)=> ((c=c*255|0)<16 ? '0' : '') + c.toString(16);
        return '#' + toHex(this.r) + toHex(this.g) + toHex(this.b) + (useAlpha ? toHex(this.a) : '');
    }

    /** Set this color from a hex code
     * @param {String} hex - html hex code
     * @return {Color} */
    setHex(hex)
    {
        const fromHex = (c)=> clamp(parseInt(hex.slice(c,c+2),16)/255);
        this.r = fromHex(1);
        this.g = fromHex(3),
        this.b = fromHex(5);
        this.a = hex.length > 7 ? fromHex(7) : 1;
        return this;
    }
    
    /** Returns this color expressed as 32 bit RGBA value
     * @return {Number} */
    rgbaInt()  
    {
        const r = clamp(this.r)*255|0;
        const g = clamp(this.g)*255<<8;
        const b = clamp(this.b)*255<<16;
        const a = clamp(this.a)*255<<24;
        return r + g + b + a;
    }
}

///////////////////////////////////////////////////////////////////////////////

/**
 * Timer object tracks how long has passed since it was set
 * @example
 * let a = new Timer;    // creates a timer that is not set
 * a.set(3);             // sets the timer to 3 seconds
 *
 * let b = new Timer(1); // creates a timer with 1 second left
 * b.unset();            // unsets the timer
 */
class Timer
{
    /** Create a timer object set time passed in
     *  @param {Number} [timeLeft] - How much time left before the timer elapses in seconds */
    constructor(timeLeft) { this.time = timeLeft == undefined ? undefined : time + timeLeft; this.setTime = timeLeft; }

    /** Set the timer with seconds passed in
     *  @param {Number} [timeLeft] - How much time left before the timer is elapsed in seconds */
    set(timeLeft=0) { this.time = time + timeLeft; this.setTime = timeLeft; }

    /** Unset the timer */
    unset() { this.time = undefined; }

    /** Returns true if set
     * @return {Boolean} */
    isSet() { return this.time != undefined; }

    /** Returns true if set and has not elapsed
     * @return {Boolean} */
    active() { return time <= this.time; }

    /** Returns true if set and elapsed
     * @return {Boolean} */
    elapsed() { return time > this.time; }

    /** Get how long since elapsed, returns 0 if not set (returns negative if currently active)
     * @return {Number} */
    get() { return this.isSet()? time - this.time : 0; }

    /** Get percentage elapsed based on time it was set to, returns 0 if not set
     * @return {Number} */
    getPercent() { return this.isSet()? percent(this.time - time, this.setTime, 0) : 0; }
    
    /** Returns this timer expressed as a string
     * @return {String} */
    toString() { { return this.isSet() ? Math.abs(this.get()) + ' seconds ' + (this.get()<0 ? 'before' : 'after' ) : 'unset'; }}
    
    /** Get how long since elapsed, returns 0 if not set (returns negative if currently active)
     * @return {Number} */
    valueOf()               { return this.get(); }
}
/**
 * LittleJS Engine Settings
 * - All settings for the engine are here
 * @namespace Settings
 */



///////////////////////////////////////////////////////////////////////////////
// Camera settings

/** Position of camera in world space
 *  @type {Vector2}
 *  @default Vector2()
 *  @memberof Settings */
let cameraPos = vec2();

/** Scale of camera in world space
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let cameraScale = 32;

///////////////////////////////////////////////////////////////////////////////
// Display settings

/** The max size of the canvas, centered if window is larger
 *  @type {Vector2}
 *  @default Vector2(1920,1200)
 *  @memberof Settings */
let canvasMaxSize = vec2(1920, 1200);

/** Fixed size of the canvas, if enabled canvas size never changes
 * - you may also need to set mainCanvasSize if using screen space coords in startup
 *  @type {Vector2}
 *  @default Vector2()
 *  @memberof Settings */
let canvasFixedSize = vec2();

/** Disables filtering for crisper pixel art if true
 *  @type {Boolean}
 *  @default
 *  @memberof Settings */
let canvasPixelated = true;

/** Default font used for text rendering
 *  @type {String}
 *  @default
 *  @memberof Settings */
let fontDefault = 'arial';

///////////////////////////////////////////////////////////////////////////////
// WebGL settings

/** Enable webgl rendering, webgl can be disabled and removed from build (with some features disabled)
 *  @type {Boolean}
 *  @default
 *  @memberof Settings */
let glEnable = true;

///////////////////////////////////////////////////////////////////////////////
// Tile sheet settings

/** Default size of tiles in pixels
 *  @type {Vector2}
 *  @default Vector2(16,16)
 *  @memberof Settings */
let tileSizeDefault = vec2(16);

/** How many pixels smaller to draw tiles to prevent bleeding from neighbors
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let tileFixBleedScale = .1;

/** Default object mass for collision calcuations (how heavy objects are)
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let objectDefaultMass = 1;

/** How much to slow velocity by each frame (0-1)
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let objectDefaultDamping = 1;

/** How much to slow angular velocity each frame (0-1)
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let objectDefaultAngleDamping = 1;

/** How much to bounce when a collision occurs (0-1)
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let objectDefaultElasticity = 0;

/** How much to slow when touching (0-1)
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let objectDefaultFriction = .8;

/** Clamp max speed to avoid fast objects missing collisions
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let objectMaxSpeed = 1;

/** How much gravity to apply to objects along the Y axis, negative is down
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let gravity = 0;

/** Scales emit rate of particles, useful for low graphics mode (0 disables particle emitters)
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let particleEmitRateScale = 1;

///////////////////////////////////////////////////////////////////////////////
// Input settings

/** Should gamepads be allowed
 *  @type {Boolean}
 *  @default
 *  @memberof Settings */
let gamepadsEnable = true;

/** Volume scale to apply to all sound, music and speech
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let soundVolume = .5;

/** Default range where sound no longer plays
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let soundDefaultRange = 40;

/** Default range percent to start tapering off sound (0-1)
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let soundDefaultTaper = .7;

///////////////////////////////////////////////////////////////////////////////
// Medals settings

/** How long to show medals for in seconds
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let medalDisplayTime = 5;

/** How quickly to slide on/off medals in seconds
 *  @type {Number}
 *  @default
 *  @memberof Settings */
let medalDisplaySlideTime = .5;

/** Size of medal display
 *  @type {Vector2}
 *  @default Vector2(640,80)
 *  @memberof Settings */
vec2(640, 80);

///////////////////////////////////////////////////////////////////////////////
// Setters for global variables

/** Set position of camera in world space
 *  @param {Vector2} pos
 *  @memberof Settings */
function setCameraPos(pos) { cameraPos = pos; }

/** Set scale of camera in world space
 *  @param {Number} scale
 *  @memberof Settings */
function setCameraScale(scale) { cameraScale = scale; }

/** Set default font used for text rendering
 *  @param {String} font
 *  @memberof Settings */
function setFontDefault(font) { fontDefault = font; }

/** Set default size of tiles in pixels
 *  @param {Vector2} size
 *  @memberof Settings */
function setTileSizeDefault(size) { tileSizeDefault = size; }

/** Set to prevent tile bleeding from neighbors in pixels
 *  @param {Number} scale
 *  @memberof Settings */
function setTileFixBleedScale(scale) { tileFixBleedScale = scale; }
/** 
 * LittleJS Object System
 */



/** 
 * LittleJS Object Base Object Class
 * - Top level object class used by the engine
 * - Automatically adds self to object list
 * - Will be updated and rendered each frame
 * - Renders as a sprite from a tilesheet by default
 * - Can have color and additive color applied
 * - 2D Physics and collision system
 * - Sorted by renderOrder
 * - Objects can have children attached
 * - Parents are updated before children, and set child transform
 * - Call destroy() to get rid of objects
 *
 * The physics system used by objects is simple and fast with some caveats...
 * - Collision uses the axis aligned size, the object's rotation angle is only for rendering
 * - Objects are guaranteed to not intersect tile collision from physics
 * - If an object starts or is moved inside tile collision, it will not collide with that tile
 * - Collision for objects can be set to be solid to block other objects
 * - Objects may get pushed into overlapping other solid objects, if so they will push away
 * - Solid objects are more performance intensive and should be used sparingly
 * @example
 * // create an engine object, normally you would first extend the class with your own
 * const pos = vec2(2,3);
 * const object = new EngineObject(pos); 
 */
class EngineObject
{
    /** Create an engine object and adds it to the list of objects
     *  @param {Vector2}  [pos=(0,0)]       - World space position of the object
     *  @param {Vector2}  [size=(1,1)]      - World space size of the object
     *  @param {TileInfo} [tileInfo]        - Tile info to render object (undefined is untextured)
     *  @param {Number}   [angle]           - Angle the object is rotated by
     *  @param {Color}    [color=(1,1,1,1)] - Color to apply to tile when rendered
     *  @param {Number}   [renderOrder]     - Objects sorted by renderOrder before being rendered
     */
    constructor(pos=vec2(), size=vec2(1), tileInfo, angle=0, color, renderOrder=0)
    {
        // set passed in params
        ASSERT(isVector2(pos) && isVector2(size), 'ensure pos and size are vec2s');
        ASSERT(typeof tileInfo !== 'number' || !tileInfo, 'old style tile setup');

        /** @property {Vector2} - World space position of the object */
        this.pos = pos.copy();
        /** @property {Vector2} - World space width and height of the object */
        this.size = size;
        /** @property {Vector2} - Size of object used for drawing, uses size if not set */
        this.drawSize = undefined;
        /** @property {TileInfo} - Tile info to render object (undefined is untextured) */
        this.tileInfo = tileInfo;
        /** @property {Number}  - Angle to rotate the object */
        this.angle = angle;
        /** @property {Color}   - Color to apply when rendered */
        this.color = color;
        /** @property {Color}   - Additive color to apply when rendered */
        this.additiveColor = undefined;
        /** @property {Boolean} - Should it flip along y axis when rendered */
        this.mirror = false;

        // physical properties
        /** @property {Number} [mass=objectDefaultMass]                 - How heavy the object is, static if 0 */
        this.mass         = objectDefaultMass;
        /** @property {Number} [damping=objectDefaultDamping]           - How much to slow down velocity each frame (0-1) */
        this.damping      = objectDefaultDamping;
        /** @property {Number} [angleDamping=objectDefaultAngleDamping] - How much to slow down rotation each frame (0-1) */
        this.angleDamping = objectDefaultAngleDamping;
        /** @property {Number} [elasticity=objectDefaultElasticity]     - How bouncy the object is when colliding (0-1) */
        this.elasticity   = objectDefaultElasticity;
        /** @property {Number} [friction=objectDefaultFriction]         - How much friction to apply when sliding (0-1) */
        this.friction     = objectDefaultFriction;
        /** @property {Number}  - How much to scale gravity by for this object */
        this.gravityScale = 1;
        /** @property {Number}  - Objects are sorted by render order */
        this.renderOrder = renderOrder;
        /** @property {Vector2} - Velocity of the object */
        this.velocity = vec2();
        /** @property {Number}  - Angular velocity of the object */
        this.angleVelocity = 0;
        /** @property {Number}  - Track when object was created  */
        this.spawnTime = time;
        /** @property {Array}   - List of children of this object */
        this.children = [];

        // parent child system
        /** @property {EngineObject} - Parent of object if in local space  */
        this.parent = undefined;
        /** @property {Vector2}      - Local position if child */
        this.localPos = vec2();
        /** @property {Number}       - Local angle if child  */
        this.localAngle = 0;

        // collision flags
        /** @property {Boolean} - Object collides with the tile collision */
        this.collideTiles = false;
        /** @property {Boolean} - Object collides with solid objects */
        this.collideSolidObjects = false;
        /** @property {Boolean} - Object collides with and blocks other objects */
        this.isSolid = false;
        /** @property {Boolean} - Object collides with raycasts */
        this.collideRaycast = false;

        // add to list of objects
        engineObjects.push(this);
    }
    
    /** Update the object transform and physics, called automatically by engine once each frame */
    update()
    {
        const parent = this.parent;
        if (parent)
        {
            // copy parent pos/angle
            this.pos = this.localPos.multiply(vec2(parent.getMirrorSign(),1)).rotate(-parent.angle).add(parent.pos);
            this.angle = parent.getMirrorSign()*this.localAngle + parent.angle;
            return;
        }

        // limit max speed to prevent missing collisions
        this.velocity.x = clamp(this.velocity.x, -objectMaxSpeed, objectMaxSpeed);
        this.velocity.y = clamp(this.velocity.y, -objectMaxSpeed, objectMaxSpeed);

        // apply physics
        const oldPos = this.pos.copy();
        this.velocity.y += gravity * this.gravityScale;
        this.pos.x += this.velocity.x *= this.damping;
        this.pos.y += this.velocity.y *= this.damping;
        this.angle += this.angleVelocity *= this.angleDamping;

        // physics sanity checks
        ASSERT(this.angleDamping >= 0 && this.angleDamping <= 1);
        ASSERT(this.damping >= 0 && this.damping <= 1);

        if (!this.mass) // do not update collision for fixed objects
            return;

        const wasMovingDown = this.velocity.y < 0;
        if (this.groundObject)
        {
            // apply friction in local space of ground object
            const groundSpeed = this.groundObject.velocity ? this.groundObject.velocity.x : 0;
            this.velocity.x = groundSpeed + (this.velocity.x - groundSpeed) * this.friction;
            this.groundObject = 0;
            //debugOverlay && debugPhysics && debugPoint(this.pos.subtract(vec2(0,this.size.y/2)), '#0f0');
        }

        if (this.collideSolidObjects)
        {
            // check collisions against solid objects
            const epsilon = .001; // necessary to push slightly outside of the collision
            for (const o of engineObjectsCollide)
            {
                // non solid objects don't collide with eachother
                if (!this.isSolid && !o.isSolid || o.destroyed || o.parent || o == this)
                    continue;

                // check collision
                if (!isOverlapping(this.pos, this.size, o.pos, o.size))
                    continue;

                // notify objects of collision and check if should be resolved
                const collide1 = this.collideWithObject(o);
                const collide2 = o.collideWithObject(this);
                if (!collide1 || !collide2)
                    continue;

                if (isOverlapping(oldPos, this.size, o.pos, o.size))
                {
                    // if already was touching, try to push away
                    const deltaPos = oldPos.subtract(o.pos);
                    const length = deltaPos.length();
                    const pushAwayAccel = .001; // push away if already overlapping
                    const velocity = length < .01 ? randVector(pushAwayAccel) : deltaPos.scale(pushAwayAccel/length);
                    this.velocity = this.velocity.add(velocity);
                    if (o.mass) // push away if not fixed
                        o.velocity = o.velocity.subtract(velocity);
                        
                    debugOverlay && debugPhysics && debugAABB(this.pos, this.size, o.pos, o.size, '#f00');
                    continue;
                }

                // check for collision
                const sizeBoth = this.size.add(o.size);
                const smallStepUp = (oldPos.y - o.pos.y)*2 > sizeBoth.y + gravity; // prefer to push up if small delta
                const isBlockedX = abs(oldPos.y - o.pos.y)*2 < sizeBoth.y;
                const isBlockedY = abs(oldPos.x - o.pos.x)*2 < sizeBoth.x;
                const elasticity = max(this.elasticity, o.elasticity);
                
                if (smallStepUp || isBlockedY || !isBlockedX) // resolve y collision
                {
                    // push outside object collision
                    this.pos.y = o.pos.y + (sizeBoth.y/2 + epsilon) * sign(oldPos.y - o.pos.y);
                    if (o.groundObject && wasMovingDown || !o.mass)
                    {
                        // set ground object if landed on something
                        if (wasMovingDown)
                            this.groundObject = o;

                        // bounce if other object is fixed or grounded
                        this.velocity.y *= -elasticity;
                    }
                    else if (o.mass)
                    {
                        // inelastic collision
                        const inelastic = (this.mass * this.velocity.y + o.mass * o.velocity.y) / (this.mass + o.mass);

                        // elastic collision
                        const elastic0 = this.velocity.y * (this.mass - o.mass) / (this.mass + o.mass)
                            + o.velocity.y * 2 * o.mass / (this.mass + o.mass);
                        const elastic1 = o.velocity.y * (o.mass - this.mass) / (this.mass + o.mass)
                            + this.velocity.y * 2 * this.mass / (this.mass + o.mass);

                        // lerp betwen elastic or inelastic based on elasticity
                        this.velocity.y = lerp(elasticity, inelastic, elastic0);
                        o.velocity.y = lerp(elasticity, inelastic, elastic1);
                    }
                }
                if (!smallStepUp && isBlockedX) // resolve x collision
                {
                    // push outside collision
                    this.pos.x = o.pos.x + (sizeBoth.x/2 + epsilon) * sign(oldPos.x - o.pos.x);
                    if (o.mass)
                    {
                        // inelastic collision
                        const inelastic = (this.mass * this.velocity.x + o.mass * o.velocity.x) / (this.mass + o.mass);

                        // elastic collision
                        const elastic0 = this.velocity.x * (this.mass - o.mass) / (this.mass + o.mass)
                            + o.velocity.x * 2 * o.mass / (this.mass + o.mass);
                        const elastic1 = o.velocity.x * (o.mass - this.mass) / (this.mass + o.mass)
                            + this.velocity.x * 2 * this.mass / (this.mass + o.mass);

                        // lerp betwen elastic or inelastic based on elasticity
                        this.velocity.x = lerp(elasticity, inelastic, elastic0);
                        o.velocity.x = lerp(elasticity, inelastic, elastic1);
                    }
                    else // bounce if other object is fixed
                        this.velocity.x *= -elasticity;
                }
                debugOverlay && debugPhysics && debugAABB(this.pos, this.size, o.pos, o.size, '#f0f');
            }
        }
        if (this.collideTiles)
        {
            // check collision against tiles
            if (tileCollisionTest(this.pos, this.size, this))
            {
                // if already was stuck in collision, don't do anything
                // this should not happen unless something starts in collision
                if (!tileCollisionTest(oldPos, this.size, this))
                {
                    // test which side we bounced off (or both if a corner)
                    const isBlockedY = tileCollisionTest(vec2(oldPos.x, this.pos.y), this.size, this);
                    const isBlockedX = tileCollisionTest(vec2(this.pos.x, oldPos.y), this.size, this);
                    if (isBlockedY || !isBlockedX)
                    {
                        // set if landed on ground
                        this.groundObject = wasMovingDown;

                        // bounce velocity
                        this.velocity.y *= -this.elasticity;

                        // adjust next velocity to settle on ground
                        const o = (oldPos.y - this.size.y/2|0) - (oldPos.y - this.size.y/2);
                        if (o < 0 && o > this.damping * this.velocity.y + gravity * this.gravityScale) 
                            this.velocity.y = this.damping ? (o - gravity * this.gravityScale) / this.damping : 0;

                        // move to previous position
                        this.pos.y = oldPos.y;
                    }
                    if (isBlockedX)
                    {
                        // move to previous position and bounce
                        this.pos.x = oldPos.x;
                        this.velocity.x *= -this.elasticity;
                    }
                }
            }
        }
    }
       
    /** Render the object, draws a tile by default, automatically called each frame, sorted by renderOrder */
    render()
    {
        // default object render
        drawTile(this.pos, this.drawSize || this.size, this.tileInfo, this.color, this.angle, this.mirror, this.additiveColor);
    }
    
    /** Destroy this object, destroy it's children, detach it's parent, and mark it for removal */
    destroy()
    { 
        if (this.destroyed)
            return;
        
        // disconnect from parent and destroy chidren
        this.destroyed = 1;
        this.parent && this.parent.removeChild(this);
        for (const child of this.children)
            child.destroy(child.parent = 0);
    }
    
    /** Called to check if a tile collision should be resolved
     *  @param {Number}  tileData - the value of the tile at the position
     *  @param {Vector2} pos      - tile where the collision occured
     *  @return {Boolean}         - true if the collision should be resolved */
    collideWithTile(tileData, pos)    { return tileData > 0; }

    /** Called to check if a object collision should be resolved
     *  @param {EngineObject} object - the object to test against
     *  @return {Boolean}            - true if the collision should be resolved
     */
    collideWithObject(object)         { return true; }

    /** How long since the object was created
     *  @return {Number} */
    getAliveTime()                    { return time - this.spawnTime; }

    /** Apply acceleration to this object (adjust velocity, not affected by mass)
     *  @param {Vector2} acceleration */
    applyAcceleration(acceleration)   { if (this.mass) this.velocity = this.velocity.add(acceleration); }

    /** Apply force to this object (adjust velocity, affected by mass)
     *  @param {Vector2} force */
    applyForce(force)	              { this.applyAcceleration(force.scale(1/this.mass)); }
    
    /** Get the direction of the mirror
     *  @return {Number} -1 if this.mirror is true, or 1 if not mirrored */
    getMirrorSign() { return this.mirror ? -1 : 1; }

    /** Attaches a child to this with a given local transform
     *  @param {EngineObject} child
     *  @param {Vector2}      [localPos=(0,0)]
     *  @param {Number}       [localAngle] */
    addChild(child, localPos=vec2(), localAngle=0)
    {
        ASSERT(!child.parent && !this.children.includes(child));
        this.children.push(child);
        child.parent = this;
        child.localPos = localPos.copy();
        child.localAngle = localAngle;
    }

    /** Removes a child from this one
     *  @param {EngineObject} child */
    removeChild(child)
    {
        ASSERT(child.parent == this && this.children.includes(child));
        this.children.splice(this.children.indexOf(child), 1);
        child.parent = 0;
    }

    /** Set how this object collides
     *  @param {Boolean} [collideSolidObjects] - Does it collide with solid objects?
     *  @param {Boolean} [isSolid]             - Does it collide with and block other objects? (expensive in large numbers)
     *  @param {Boolean} [collideTiles]        - Does it collide with the tile collision?
     *  @param {Boolean} [collideRaycast]      - Does it collide with raycasts? */
    setCollision(collideSolidObjects=true, isSolid=true, collideTiles=true, collideRaycast=true)
    {
        ASSERT(collideSolidObjects || !isSolid, 'solid objects must be set to collide');

        this.collideSolidObjects = collideSolidObjects;
        this.isSolid = isSolid;
        this.collideTiles = collideTiles;
        this.collideRaycast = collideRaycast;
    }

    /** Returns string containg info about this object for debugging
     *  @return {String} */
    toString()
    {
        {
            let text = 'type = ' + this.constructor.name;
            if (this.pos.x || this.pos.y)
                text += '\npos = ' + this.pos;
            if (this.velocity.x || this.velocity.y)
                text += '\nvelocity = ' + this.velocity;
            if (this.size.x || this.size.y)
                text += '\nsize = ' + this.size;
            if (this.angle)
                text += '\nangle = ' + this.angle.toFixed(3);
            if (this.color)
                text += '\ncolor = ' + this.color;
            return text;
        }
    }
}
/** 
 * LittleJS Drawing System
 * - Hybrid system with both Canvas2D and WebGL available
 * - Super fast tile sheet rendering with WebGL
 * - Can apply rotation, mirror, color and additive color
 * - Font rendering system with built in engine font
 * - Many useful utility functions
 * 
 * LittleJS uses a hybrid rendering solution with the best of both Canvas2D and WebGL.
 * There are 3 canvas/contexts available to draw to...
 * mainCanvas - 2D background canvas, non WebGL stuff like tile layers are drawn here.
 * glCanvas - Used by the accelerated WebGL batch rendering system.
 * overlayCanvas - Another 2D canvas that appears on top of the other 2 canvases.
 * 
 * The WebGL rendering system is very fast with some caveats...
 * - Switching blend modes (additive) or textures causes another draw call which is expensive in excess
 * - Group additive rendering together using renderOrder to mitigate this issue
 * 
 * The LittleJS rendering solution is intentionally simple, feel free to adjust it for your needs!
 * @namespace Draw
 */



/** The primary 2D canvas visible to the user
 *  @type {HTMLCanvasElement}
 *  @memberof Draw */
let mainCanvas;

/** 2d context for mainCanvas
 *  @type {CanvasRenderingContext2D}
 *  @memberof Draw */
let mainContext;

/** A canvas that appears on top of everything the same size as mainCanvas
 *  @type {HTMLCanvasElement}
 *  @memberof Draw */
let overlayCanvas;

/** 2d context for overlayCanvas
 *  @type {CanvasRenderingContext2D}
 *  @memberof Draw */
let overlayContext;

/** The size of the main canvas (and other secondary canvases) 
 *  @type {Vector2}
 *  @memberof Draw */
let mainCanvasSize = vec2();

/** Array containing texture info for batch rendering system
 *  @type {Array}
 *  @memberof Draw */
let textureInfos = [];

// Keep track of how many draw calls there were each frame for debugging
let drawCount;

///////////////////////////////////////////////////////////////////////////////

/** 
 * Create a tile info object
 * - This can take vecs or floats for easier use and conversion
 * - If an index is passed in, the tile size and index will determine the position
 * @param {(Number|Vector2)} [pos=(0,0)]            - Top left corner of tile in pixels or index
 * @param {(Number|Vector2)} [size=tileSizeDefault] - Size of tile in pixels
 * @param {Number} [textureIndex]                   - Texture index to use
 * @return {TileInfo}
 * @example
 * tile(2)                       // a tile at index 2 using the default tile size of 16
 * tile(5, 8)                    // a tile at index 5 using a tile size of 8
 * tile(1, 16, 3)                // a tile at index 1 of size 16 on texture 3
 * tile(vec2(4,8), vec2(30,10))  // a tile at pixel location (4,8) with a size of (30,10)
 * @memberof Draw
 */
function tile(pos=vec2(), size=tileSizeDefault, textureIndex=0)
{
    // if size is a number, make it a vector
    if (typeof size === 'number')
    {
        ASSERT(size > 0);
        size = vec2(size);
    }

    // if pos is a number, use it as a tile index
    if (typeof pos === 'number')
    {
        const textureInfo = textureInfos[textureIndex];
        ASSERT(textureInfo, 'Texture not loaded');
        const cols = textureInfo.size.x / size.x |0;
        pos = vec2((pos%cols)*size.x, (pos/cols|0)*size.y);
    }

    // return a tile info object
    return new TileInfo(pos, size, textureIndex); 
}

/** 
 * Tile Info - Stores info about how to draw a tile
 */
class TileInfo
{
    /** Create a tile info object
     *  @param {Vector2} [pos=(0,0)]            - Top left corner of tile in pixels
     *  @param {Vector2} [size=tileSizeDefault] - Size of tile in pixels
     *  @param {Number}  [textureIndex]         - Texture index to use
     */
    constructor(pos=vec2(), size=tileSizeDefault, textureIndex=0)
    {
        /** @property {Vector2} - Top left corner of tile in pixels */
        this.pos = pos;
        /** @property {Vector2} - Size of tile in pixels */
        this.size = size;
        /** @property {Number} - Texture index to use */
        this.textureIndex = textureIndex;
    }

    /** Returns a copy of this tile offset by a vector
    *  @param {Vector2} offset - Offset to apply in pixels
    *  @return {TileInfo}
    */
    offset(offset)
    { return new TileInfo(this.pos.add(offset), this.size, this.textureIndex); }

    /** Returns a copy of this tile offset by a number of animation frames
    *  @param {Number} frame - Offset to apply in animation frames
    *  @return {TileInfo}
    */
    frame(frame)
    {
        ASSERT(typeof frame == 'number');
        return this.offset(vec2(frame*this.size.x, 0));
    }

    /** Returns the texture info for this tile
    *  @return {TextureInfo}
    */
    getTextureInfo()
    { return textureInfos[this.textureIndex]; }
}

/** Texture Info - Stores info about each texture */
class TextureInfo
{
    /**
     * Create a TextureInfo, called automatically by the engine
     * @param {HTMLImageElement} image
     */
    constructor(image)
    {
        /** @property {HTMLImageElement} - image source */
        this.image = image;
        /** @property {Vector2} - size of the image */
        this.size = vec2(image.width, image.height);
        /** @property {WebGLTexture} - webgl texture */
        this.glTexture = glCreateTexture(image);
        /** @property {Vector2} - size to adjust tile to fix bleeding */
        this.fixBleedSize = vec2(tileFixBleedScale).divide(this.size);
    }
}

///////////////////////////////////////////////////////////////////////////////

/** Convert from screen to world space coordinates
 *  @param {Vector2} screenPos
 *  @return {Vector2}
 *  @memberof Draw */
function screenToWorld(screenPos)
{
    return new Vector2
    (
        (screenPos.x - mainCanvasSize.x/2 + .5) /  cameraScale + cameraPos.x,
        (screenPos.y - mainCanvasSize.y/2 + .5) / -cameraScale + cameraPos.y
    );
}

/** Convert from world to screen space coordinates
 *  @param {Vector2} worldPos
 *  @return {Vector2}
 *  @memberof Draw */
function worldToScreen(worldPos)
{
    return new Vector2
    (
        (worldPos.x - cameraPos.x) *  cameraScale + mainCanvasSize.x/2 - .5,
        (worldPos.y - cameraPos.y) * -cameraScale + mainCanvasSize.y/2 - .5
    );
}

/** Get the camera's visible area in world space
 *  @return {Vector2}
 *  @memberof Draw */
function getCameraSize() { return mainCanvasSize.scale(1/cameraScale); }

/** Draw textured tile centered in world space, with color applied if using WebGL
 *  @param {Vector2} pos                        - Center of the tile in world space
 *  @param {Vector2} [size=(1,1)]               - Size of the tile in world space
 *  @param {TileInfo}[tileInfo]                 - Tile info to use, untextured if undefined
 *  @param {Color}   [color=(1,1,1,1)]          - Color to modulate with
 *  @param {Number}  [angle]                    - Angle to rotate by
 *  @param {Boolean} [mirror]                   - If true image is flipped along the Y axis
 *  @param {Color}   [additiveColor=(0,0,0,0)]  - Additive color to be applied
 *  @param {Boolean} [useWebGL=glEnable]        - Use accelerated WebGL rendering
 *  @param {Boolean} [screenSpace=false]        - If true the pos and size are in screen space
 *  @param {CanvasRenderingContext2D} [context] - Canvas 2D context to draw to
 *  @memberof Draw */
function drawTile(pos, size=vec2(1), tileInfo, color=new Color,
    angle=0, mirror, additiveColor=new Color(0,0,0,0), useWebGL=glEnable, screenSpace, context)
{
    ASSERT(!context || !useWebGL, 'context only supported in canvas 2D mode'); 
    ASSERT(typeof tileInfo !== 'number' || !tileInfo, 
        'this is an old style calls, to fix replace it with tile(tileIndex, tileSize)');

    const textureInfo = tileInfo && tileInfo.getTextureInfo();
    if (useWebGL)
    {
        if (screenSpace)
        {
            // convert to world space
            pos = screenToWorld(pos);
            size = size.scale(1/cameraScale);
        }
        
        if (textureInfo)
        {
            // calculate uvs and render
            const x = tileInfo.pos.x / textureInfo.size.x;
            const y = tileInfo.pos.y / textureInfo.size.y;
            const w = tileInfo.size.x / textureInfo.size.x;
            const h = tileInfo.size.y / textureInfo.size.y;
            const tileImageFixBleed = textureInfo.fixBleedSize;
            glSetTexture(textureInfo.glTexture);
            glDraw(pos.x, pos.y, mirror ? -size.x : size.x, size.y, angle, 
                x + tileImageFixBleed.x,     y + tileImageFixBleed.y, 
                x - tileImageFixBleed.x + w, y - tileImageFixBleed.y + h, 
                color.rgbaInt(), additiveColor.rgbaInt()); 
        }
        else
        {
            // if no tile info, force untextured
            glDraw(pos.x, pos.y, size.x, size.y, angle, 0, 0, 0, 0, 0, color.rgbaInt()); 
        }
    }
    else
    {
        // normal canvas 2D rendering method (slower)
        showWatermark && ++drawCount;
        drawCanvas2D(pos, size, angle, mirror, (context)=>
        {
            if (textureInfo)
            {
                // calculate uvs and render
                const x = tileInfo.pos.x + tileFixBleedScale;
                const y = tileInfo.pos.y + tileFixBleedScale;
                const w = tileInfo.size.x - 2*tileFixBleedScale;
                const h = tileInfo.size.y - 2*tileFixBleedScale;
                context.globalAlpha = color.a; // only alpha is supported
                context.drawImage(textureInfo.image, x, y, w, h, -.5, -.5, 1, 1);
                context.globalAlpha = 1; // set back to full alpha
            }
            else
            {
                // if no tile info, force untextured
                context.fillStyle = color;
                context.fillRect(-.5, -.5, 1, 1);
            }
        }, screenSpace, context);
    }
}

/** Draw colored rect centered on pos
 *  @param {Vector2} pos
 *  @param {Vector2} [size=(1,1)]
 *  @param {Color}   [color=(1,1,1,1)]
 *  @param {Number}  [angle]
 *  @param {Boolean} [useWebGL=glEnable]
 *  @param {Boolean} [screenSpace=false]
 *  @param {CanvasRenderingContext2D} [context]
 *  @memberof Draw */
function drawRect(pos, size, color, angle, useWebGL, screenSpace, context)
{ 
    drawTile(pos, size, undefined, color, angle, false, undefined, useWebGL, screenSpace, context); 
}

/** Draw colored line between two points
 *  @param {Vector2} posA
 *  @param {Vector2} posB
 *  @param {Number}  [thickness]
 *  @param {Color}   [color=(1,1,1,1)]
 *  @param {Boolean} [useWebGL=glEnable]
 *  @param {Boolean} [screenSpace=false]
 *  @param {CanvasRenderingContext2D} [context]
 *  @memberof Draw */
function drawLine(posA, posB, thickness=.1, color, useWebGL, screenSpace, context)
{
    const halfDelta = vec2((posB.x - posA.x)/2, (posB.y - posA.y)/2);
    const size = vec2(thickness, halfDelta.length()*2);
    drawRect(posA.add(halfDelta), size, color, halfDelta.angle(), useWebGL, screenSpace, context);
}

/** Draw directly to a 2d canvas context in world space
 *  @param {Vector2}  pos
 *  @param {Vector2}  size
 *  @param {Number}   angle
 *  @param {Boolean}  mirror
 *  @param {Function} drawFunction
 *  @param {Boolean} [screenSpace=false]
 *  @param {CanvasRenderingContext2D} [context=mainContext]
 *  @memberof Draw */
function drawCanvas2D(pos, size, angle, mirror, drawFunction, screenSpace, context=mainContext)
{
    if (!screenSpace)
    {
        // transform from world space to screen space
        pos = worldToScreen(pos);
        size = size.scale(cameraScale);
    }
    context.save();
    context.translate(pos.x+.5, pos.y+.5);
    context.rotate(angle);
    context.scale(mirror ? -size.x : size.x, size.y);
    drawFunction(context);
    context.restore();
}

/** Enable normal or additive blend mode
 *  @param {Boolean} [additive]
 *  @param {Boolean} [useWebGL=glEnable]
 *  @param {CanvasRenderingContext2D} [context=mainContext]
 *  @memberof Draw */
function setBlendMode(additive, useWebGL=glEnable, context)
{
    ASSERT(!context || !useWebGL, 'context only supported in canvas 2D mode');
    if (useWebGL)
        glAdditive = additive;
    else
    {
        if (!context)
            context = mainContext;
        context.globalCompositeOperation = additive ? 'lighter' : 'source-over';
    }
}

/** Draw text on overlay canvas in world space
 *  Automatically splits new lines into rows
 *  @param {String}  text
 *  @param {Vector2} pos
 *  @param {Number}  [size]
 *  @param {Color}   [color=(1,1,1,1)]
 *  @param {Number}  [lineWidth]
 *  @param {Color}   [lineColor=(0,0,0,1)]
 *  @param {CanvasTextAlign}  [textAlign='center']
 *  @param {String}  [font=fontDefault]
 *  @param {CanvasRenderingContext2D} [context=overlayContext]
 *  @memberof Draw */
function drawText(text, pos, size=1, color, lineWidth=0, lineColor, textAlign, font, context)
{
    drawTextScreen(text, worldToScreen(pos), size*cameraScale, color, lineWidth*cameraScale, lineColor, textAlign, font, context);
}

/** Draw text on overlay canvas in screen space
 *  Automatically splits new lines into rows
 *  @param {String}  text
 *  @param {Vector2} pos
 *  @param {Number}  [size]
 *  @param {Color}   [color=(1,1,1,1)]
 *  @param {Number}  [lineWidth]
 *  @param {Color}   [lineColor=(0,0,0,1)]
 *  @param {CanvasTextAlign}  [textAlign]
 *  @param {String}  [font=fontDefault]
 *  @param {CanvasRenderingContext2D} [context=overlayContext]
 *  @memberof Draw */
function drawTextScreen(text, pos, size=1, color=new Color, lineWidth=0, lineColor=new Color(0,0,0), textAlign='center', font=fontDefault, context=overlayContext)
{
    context.fillStyle = color.toString();
    context.lineWidth = lineWidth;
    context.strokeStyle = lineColor.toString();
    context.textAlign = textAlign;
    context.font = size + 'px '+ font;
    context.textBaseline = 'middle';
    context.lineJoin = 'round';

    pos = pos.copy();
    (text+'').split('\n').forEach(line=>
    {
        lineWidth && context.strokeText(line, pos.x, pos.y);
        context.fillText(line, pos.x, pos.y);
        pos.y += size;
    });
}
/** 
 * LittleJS Input System
 * - Tracks keyboard down, pressed, and released
 * - Tracks mouse buttons, position, and wheel
 * - Tracks multiple analog gamepads
 * - Virtual gamepad for touch devices
 * @namespace Input
 */



/** Returns true if device key is down
 *  @param {String|Number} key
 *  @param {Number} [device]
 *  @return {Boolean}
 *  @memberof Input */
function keyIsDown(key, device=0)
{ 
    ASSERT(device > 0 || typeof key !== 'number' || key < 3, 'use code string for keyboard');
    return inputData[device] && !!(inputData[device][key] & 1); 
}

/** Returns true if device key was pressed this frame
 *  @param {String|Number} key
 *  @param {Number} [device]
 *  @return {Boolean}
 *  @memberof Input */
function keyWasPressed(key, device=0)
{ 
    ASSERT(device > 0 || typeof key !== 'number' || key < 3, 'use code string for keyboard');
    return inputData[device] && !!(inputData[device][key] & 2); 
}

/** Returns true if device key was released this frame
 *  @param {String|Number} key
 *  @param {Number} [device]
 *  @return {Boolean}
 *  @memberof Input */
function keyWasReleased(key, device=0)
{ 
    ASSERT(device > 0 || typeof key !== 'number' || key < 3, 'use code string for keyboard');
    return inputData[device] && !!(inputData[device][key] & 4);
}

/** Clears all input
 *  @memberof Input */
function clearInput() { inputData = [[]]; }

/** Returns true if mouse button is down
 *  @function
 *  @param {Number} button
 *  @return {Boolean}
 *  @memberof Input */
const mouseIsDown = keyIsDown;

/** Returns true if mouse button was released
 *  @function
 *  @param {Number} button
 *  @return {Boolean}
 *  @memberof Input */
const mouseWasReleased = keyWasReleased;

/** Mouse pos in world space
 *  @type {Vector2}
 *  @memberof Input */
let mousePos = vec2();

/** Mouse pos in screen space
 *  @type {Vector2}
 *  @memberof Input */
let mousePosScreen = vec2();

/** Returns true if user is using gamepad (has more recently pressed a gamepad button)
 *  @type {Boolean}
 *  @memberof Input */
let isUsingGamepad = false;

/** Returns true if gamepad button is down
 *  @param {Number} button
 *  @param {Number} [gamepad]
 *  @return {Boolean}
 *  @memberof Input */
function gamepadIsDown(button, gamepad=0)
{ return keyIsDown(button, gamepad+1); }

/** Returns gamepad stick value
 *  @param {Number} stick
 *  @param {Number} [gamepad]
 *  @return {Vector2}
 *  @memberof Input */
function gamepadStick(stick,  gamepad=0)
{ return stickData[gamepad] ? stickData[gamepad][stick] || vec2() : vec2(); }

///////////////////////////////////////////////////////////////////////////////
// Input update called by engine

// store input as a bit field for each key: 1 = isDown, 2 = wasPressed, 4 = wasReleased
// mouse and keyboard are stored together in device 0, gamepads are in devices > 0
let inputData = [[]];

function inputUpdate()
{
    // clear input when lost focus (prevent stuck keys)
    isTouchDevice || document.hasFocus() || clearInput();

    // update mouse world space position
    mousePos = screenToWorld(mousePosScreen);

    // update gamepads if enabled
    gamepadsUpdate();
}

function inputUpdatePost()
{
    // clear input to prepare for next frame
    for (const deviceInputData of inputData)
    for (const i in deviceInputData)
        deviceInputData[i] &= 1;
}

///////////////////////////////////////////////////////////////////////////////
// Keyboard event handlers

{
    onkeydown = (e)=>
    {
        if (e.target != document.body) return;
        if (!e.repeat)
        {
            isUsingGamepad = false;
            inputData[0][e.code] = 3;
            inputData[0][remapKey(e.code)] = 3;
        }
    };

    onkeyup = (e)=>
    {
        if (e.target != document.body) return;
        inputData[0][e.code] = 4;
        inputData[0][remapKey(e.code)] = 4;
    };

    // handle remapping wasd keys to directions
    function remapKey(c)
    {
        return c == 'KeyW' ? 'ArrowUp' : 
            c == 'KeyS' ? 'ArrowDown' : 
            c == 'KeyA' ? 'ArrowLeft' : 
            c == 'KeyD' ? 'ArrowRight' : c ;
    }
}

///////////////////////////////////////////////////////////////////////////////
// Mouse event handlers

onmousedown = (e)=> {isUsingGamepad = false; inputData[0][e.button] = 3; mousePosScreen = mouseToScreen(e); e.button && e.preventDefault();};
onmouseup   = (e)=> inputData[0][e.button] = inputData[0][e.button] & 2 | 4;
onmousemove = (e)=> mousePosScreen = mouseToScreen(e);
onwheel     = (e)=> e.ctrlKey ? 0 : sign(e.deltaY);
oncontextmenu = (e)=> false; // prevent right click menu

// convert a mouse or touch event position to screen space
function mouseToScreen(mousePos)
{
    if (!mainCanvas)
        return vec2(); // fix bug that can occur if user clicks before page loads

    const rect = mainCanvas.getBoundingClientRect();
    return vec2(mainCanvas.width, mainCanvas.height).multiply(
        vec2(percent(mousePos.x, rect.left, rect.right), percent(mousePos.y, rect.top, rect.bottom)));
}

///////////////////////////////////////////////////////////////////////////////
// Gamepad input

// gamepad internal variables
const stickData = [];

// gamepads are updated by engine every frame automatically
function gamepadsUpdate()
{
    const applyDeadZones = (v)=>
    {
        const min=.3, max=.8;
        const deadZone = (v)=> 
            v >  min ?  percent( v, min, max) : 
            v < -min ? -percent(-v, min, max) : 0;
        return vec2(deadZone(v.x), deadZone(-v.y)).clampLength();
    };

    // return if gamepads are disabled or not supported
    if (!navigator || !navigator.getGamepads)
        return;

    // poll gamepads
    const gamepads = navigator.getGamepads();
    for (let i = gamepads.length; i--;)
    {
        // get or create gamepad data
        const gamepad = gamepads[i];
        const data = inputData[i+1] || (inputData[i+1] = []);
        const sticks = stickData[i] || (stickData[i] = []);

        if (gamepad)
        {
            // read analog sticks
            for (let j = 0; j < gamepad.axes.length-1; j+=2)
                sticks[j>>1] = applyDeadZones(vec2(gamepad.axes[j],gamepad.axes[j+1]));
            
            // read buttons
            for (let j = gamepad.buttons.length; j--;)
            {
                const button = gamepad.buttons[j];
                const wasDown = gamepadIsDown(j,i);
                data[j] = button.pressed ? wasDown ? 1 : 3 : wasDown ? 4 : 0;
                isUsingGamepad ||= !i && button.pressed;
            }

            {
                // copy dpad to left analog stick when pressed
                const dpad = vec2(
                    (gamepadIsDown(15,i)&&1) - (gamepadIsDown(14,i)&&1), 
                    (gamepadIsDown(12,i)&&1) - (gamepadIsDown(13,i)&&1));
                if (dpad.lengthSquared())
                    sticks[0] = dpad.clampLength();
            }
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
// Touch input

/** True if a touch device has been detected
 *  @memberof Input */
const isTouchDevice = window.ontouchstart !== undefined;

// try to enable touch mouse
if (isTouchDevice)
{
    // override mouse events
    let wasTouching;
    onmousedown = onmouseup = ()=> 0;

    // handle all touch events the same way
    ontouchstart = ontouchmove = ontouchend = (e)=>
    {
        // fix stalled audio requiring user interaction
        if (audioContext && audioContext.state != 'running')
            zzfx(0);

        // check if touching and pass to mouse events
        const touching = e.touches.length;
        const button = 0; // all touches are left mouse button
        if (touching)
        {
            // set event pos and pass it along
            const p = vec2(e.touches[0].clientX, e.touches[0].clientY);
            mousePosScreen = mouseToScreen(p);
            wasTouching ? isUsingGamepad = false : inputData[0][button] = 3;
        }
        else if (wasTouching)
            inputData[0][button] = inputData[0][button] & 2 | 4;

        // set was touching
        wasTouching = touching;

        // prevent default handling like copy and magnifier lens
        if (document.hasFocus()) // allow document to get focus
            e.preventDefault();
        
        // must return true so the document will get focus
        return true;
    };
}

///////////////////////////////////////////////////////////////////////////////
// touch gamepad, virtual on screen gamepad emulator for touch devices

// touch input internal variables
new Timer;
/** 
 * LittleJS Audio System
 * - <a href=https://killedbyapixel.github.io/ZzFX/>ZzFX Sound Effects</a> - ZzFX Sound Effect Generator
 * - <a href=https://keithclark.github.io/ZzFXM/>ZzFXM Music</a> - ZzFXM Music System
 * - Caches sounds and music for fast playback
 * - Can attenuate and apply stereo panning to sounds
 * - Ability to play mp3, ogg, and wave files
 * - Speech synthesis functions
 * @namespace Audio
 */



/** 
 * Sound Object - Stores a sound for later use and can be played positionally
 * 
 * <a href=https://killedbyapixel.github.io/ZzFX/>Create sounds using the ZzFX Sound Designer.</a>
 * @example
 * // create a sound
 * const sound_example = new Sound([.5,.5]);
 * 
 * // play the sound
 * sound_example.play();
 */
class Sound
{
    /** Create a sound object and cache the zzfx samples for later use
     *  @param {Array}  zzfxSound - Array of zzfx parameters, ex. [.5,.5]
     *  @param {Number} [range=soundDefaultRange] - World space max range of sound, will not play if camera is farther away
     *  @param {Number} [taper=soundDefaultTaper] - At what percentage of range should it start tapering
     */
    constructor(zzfxSound, range=soundDefaultRange, taper=soundDefaultTaper)
    {

        /** @property {Number} - World space max range of sound, will not play if camera is farther away */
        this.range = range;

        /** @property {Number} - At what percentage of range should it start tapering off */
        this.taper = taper;

        /** @property {Number} - How much to randomize frequency each time sound plays */
        this.randomness = 0;

        if (zzfxSound)
        {
            // generate zzfx sound now for fast playback
            this.randomness = zzfxSound[1] || 0;
            zzfxSound[1] = 0; // generate without randomness
            this.sampleChannels = [zzfxG(...zzfxSound)];
            this.sampleRate = zzfxR;
        }
    }

    /** Play the sound
     *  @param {Vector2} [pos] - World space position to play the sound, sound is not attenuated if null
     *  @param {Number}  [volume] - How much to scale volume by (in addition to range fade)
     *  @param {Number}  [pitch] - How much to scale pitch by (also adjusted by this.randomness)
     *  @param {Number}  [randomnessScale] - How much to scale randomness
     *  @param {Boolean} [loop] - Should the sound loop
     *  @return {AudioBufferSourceNode} - The audio source node
     */
    play(pos, volume=1, pitch=1, randomnessScale=1, loop=false)
    {
        if (!this.sampleChannels) return;

        let pan;
        if (pos)
        {
            const range = this.range;
            if (range)
            {
                // apply range based fade
                const lengthSquared = cameraPos.distanceSquared(pos);
                if (lengthSquared > range*range)
                    return; // out of range

                // attenuate volume by distance
                volume *= percent(lengthSquared**.5, range, range*this.taper);
            }

            // get pan from screen space coords
            pan = worldToScreen(pos).x * 2/mainCanvas.width - 1;
        }

        // play the sound
        const playbackRate = pitch + pitch * this.randomness*randomnessScale*rand(-1,1);
        return this.source = playSamples(this.sampleChannels, volume, playbackRate, pan, loop, this.sampleRate);
    }

    /** Stop the last instance of this sound that was played */
    stop()
    {
        if (this.source)
            this.source.stop();
        this.source = undefined;
    }
    
    /** Get source of most recent instance of this sound that was played
     *  @return {AudioBufferSourceNode}
     */
    getSource() { return this.source; }

    /** Play the sound as a note with a semitone offset
     *  @param {Number}  semitoneOffset - How many semitones to offset pitch
     *  @param {Vector2} [pos] - World space position to play the sound, sound is not attenuated if null
     *  @param {Number}  [volume=1] - How much to scale volume by (in addition to range fade)
     *  @return {AudioBufferSourceNode} - The audio source node
     */
    playNote(semitoneOffset, pos, volume)
    { return this.play(pos, volume, 2**(semitoneOffset/12), 0); }

    /** Get how long this sound is in seconds
     *  @return {Number} - How long the sound is in seconds (undefined if loading)
     */
    getDuration() 
    { return this.sampleChannels && this.sampleChannels[0].length / this.sampleRate; }
    
    /** Check if sound is loading, for sounds fetched from a url
     *  @return {Boolean} - True if sound is loading and not ready to play
     */
    isLoading() { return !this.sampleChannels; }
}

/** Play an mp3, ogg, or wav audio from a local file or url
 *  @param {String}  filename - Location of sound file to play
 *  @param {Number}  [volume] - How much to scale volume by
 *  @param {Boolean} [loop] - True if the music should loop
 *  @return {HTMLAudioElement} - The audio element for this sound
 *  @memberof Audio */
function playAudioFile(filename, volume=1, loop=false)
{

    const audio = new Audio(filename);
    audio.volume = soundVolume * volume;
    audio.loop = loop;
    audio.play();
    return audio;
}

///////////////////////////////////////////////////////////////////////////////

/** Audio context used by the engine
 *  @type {AudioContext}
 *  @memberof Audio */
let audioContext = new AudioContext;

/** Keep track if audio was suspended when last sound was played
 *  @type {Boolean}
 *  @memberof Audio */
let audioSuspended = false;

/** Play cached audio samples with given settings
 *  @param {Array}   sampleChannels - Array of arrays of samples to play (for stereo playback)
 *  @param {Number}  [volume] - How much to scale volume by
 *  @param {Number}  [rate] - The playback rate to use
 *  @param {Number}  [pan] - How much to apply stereo panning
 *  @param {Boolean} [loop] - True if the sound should loop when it reaches the end
 *  @param {Number}  [sampleRate=44100] - Sample rate for the sound
 *  @return {AudioBufferSourceNode} - The audio node of the sound played
 *  @memberof Audio */
function playSamples(sampleChannels, volume=1, rate=1, pan=0, loop=false, sampleRate=zzfxR) 
{

    // prevent sounds from building up if they can't be played
    const audioWasSuspended = audioSuspended;
    if (audioSuspended = audioContext.state != 'running')
    {
        // fix stalled audio
        audioContext.resume();

        // prevent suspended sounds from building up
        if (audioWasSuspended)
            return;
    }

    // create buffer and source
    const buffer = audioContext.createBuffer(sampleChannels.length, sampleChannels[0].length, sampleRate), 
        source = audioContext.createBufferSource();

    // copy samples to buffer and setup source
    sampleChannels.forEach((c,i)=> buffer.getChannelData(i).set(c));
    source.buffer = buffer;
    source.playbackRate.value = rate;
    source.loop = loop;

    // create and connect gain node (createGain is more widely spported then GainNode construtor)
    const gainNode = audioContext.createGain();
    gainNode.gain.value = soundVolume*volume;
    gainNode.connect(audioContext.destination);

    // connect source to stereo panner and gain
    source.connect(new StereoPannerNode(audioContext, {'pan':clamp(pan, -1, 1)})).connect(gainNode);

    // play and return sound
    source.start();
    return source;
}

///////////////////////////////////////////////////////////////////////////////
// ZzFXMicro - Zuper Zmall Zound Zynth - v1.3.1 by Frank Force

/** Generate and play a ZzFX sound
 *  
 *  <a href=https://killedbyapixel.github.io/ZzFX/>Create sounds using the ZzFX Sound Designer.</a>
 *  @param {Array} zzfxSound - Array of ZzFX parameters, ex. [.5,.5]
 *  @return {AudioBufferSourceNode} - The audio node of the sound played
 *  @memberof Audio */
function zzfx(...zzfxSound) { return playSamples([zzfxG(...zzfxSound)]); }

/** Sample rate used for all ZzFX sounds
 *  @default 44100
 *  @memberof Audio */
const zzfxR = 44100; 

/** Generate samples for a ZzFX sound
 *  @param {Number}  [volume] - Volume scale (percent)
 *  @param {Number}  [randomness] - How much to randomize frequency (percent Hz)
 *  @param {Number}  [frequency] - Frequency of sound (Hz)
 *  @param {Number}  [attack] - Attack time, how fast sound starts (seconds)
 *  @param {Number}  [sustain] - Sustain time, how long sound holds (seconds)
 *  @param {Number}  [release] - Release time, how fast sound fades out (seconds)
 *  @param {Number}  [shape] - Shape of the sound wave
 *  @param {Number}  [shapeCurve] - Squarenes of wave (0=square, 1=normal, 2=pointy)
 *  @param {Number}  [slide] - How much to slide frequency (kHz/s)
 *  @param {Number}  [deltaSlide] - How much to change slide (kHz/s/s)
 *  @param {Number}  [pitchJump] - Frequency of pitch jump (Hz)
 *  @param {Number}  [pitchJumpTime] - Time of pitch jump (seconds)
 *  @param {Number}  [repeatTime] - Resets some parameters periodically (seconds)
 *  @param {Number}  [noise] - How much random noise to add (percent)
 *  @param {Number}  [modulation] - Frequency of modulation wave, negative flips phase (Hz)
 *  @param {Number}  [bitCrush] - Resamples at a lower frequency in (samples*100)
 *  @param {Number}  [delay] - Overlap sound with itself for reverb and flanger effects (seconds)
 *  @param {Number}  [sustainVolume] - Volume level for sustain (percent)
 *  @param {Number}  [decay] - Decay time, how long to reach sustain after attack (seconds)
 *  @param {Number}  [tremolo] - Trembling effect, rate controlled by repeat time (precent)
 *  @param {Number}  [filter] - Filter cutoff frequency, positive for HPF, negative for LPF (Hz)
 *  @return {Array} - Array of audio samples
 *  @memberof Audio
 */
function zzfxG
(
    // parameters
    volume = 1, randomness = .05, frequency = 220, attack = 0, sustain = 0,
    release = .1, shape = 0, shapeCurve = 1, slide = 0, deltaSlide = 0,
    pitchJump = 0, pitchJumpTime = 0, repeatTime = 0, noise = 0, modulation = 0,
    bitCrush = 0, delay = 0, sustainVolume = 1, decay = 0, tremolo = 0, filter = 0
)
{
    // init parameters
    let PI2 = PI*2, sampleRate = zzfxR,
        startSlide = slide *= 500 * PI2 / sampleRate / sampleRate,
        startFrequency = frequency *= 
            rand(1 + randomness, 1-randomness) * PI2 / sampleRate,
        b = [], t = 0, tm = 0, i = 0, j = 1, r = 0, c = 0, s = 0, f, length,

        // biquad LP/HP filter
        quality = 2, w = PI2 * abs(filter) * 2 / sampleRate,
        cos = Math.cos(w), alpha = Math.sin(w) / 2 / quality,
        a0 = 1 + alpha, a1 = -2*cos / a0, a2 = (1 - alpha) / a0,
        b0 = (1 + sign(filter) * cos) / 2 / a0, 
        b1 = -(sign(filter) + cos) / a0, b2 = b0,
        x2 = 0, x1 = 0, y2 = 0, y1 = 0;

    // scale by sample rate
    attack = attack * sampleRate + 9; // minimum attack to prevent pop
    decay *= sampleRate;
    sustain *= sampleRate;
    release *= sampleRate;
    delay *= sampleRate;
    deltaSlide *= 500 * PI2 / sampleRate**3;
    modulation *= PI2 / sampleRate;
    pitchJump *= PI2 / sampleRate;
    pitchJumpTime *= sampleRate;
    repeatTime = repeatTime * sampleRate | 0;
    volume *= soundVolume;

    // generate waveform
    for(length = attack + decay + sustain + release + delay | 0;
        i < length; b[i++] = s * volume)               // sample
    {
        if (!(++c%(bitCrush*100|0)))                   // bit crush
        {
            s = shape? shape>1? shape>2? shape>3?      // wave shape
                Math.sin(t**3) :                       // 4 noise
                clamp(Math.tan(t),1,-1):               // 3 tan
                1-(2*t/PI2%2+2)%2:                     // 2 saw
                1-4*abs(Math.round(t/PI2)-t/PI2):      // 1 triangle
                Math.sin(t);                           // 0 sin

            s = (repeatTime ?
                    1 - tremolo + tremolo*Math.sin(PI2*i/repeatTime) // tremolo
                    : 1) *
                sign(s)*(abs(s)**shapeCurve) *           // curve
                (i < attack ? i/attack :                 // attack
                i < attack + decay ?                     // decay
                1-((i-attack)/decay)*(1-sustainVolume) : // decay falloff
                i < attack  + decay + sustain ?          // sustain
                sustainVolume :                          // sustain volume
                i < length - delay ?                     // release
                (length - i - delay)/release *           // release falloff
                sustainVolume :                          // release volume
                0);                                      // post release

            s = delay ? s/2 + (delay > i ? 0 :           // delay
                (i<length-delay? 1 : (length-i)/delay) * // release delay 
                b[i-delay|0]/2/volume) : s;              // sample delay

            if (filter)                                   // apply filter
                s = y1 = b2*x2 + b1*(x2=x1) + b0*(x1=s) - a2*y2 - a1*(y2=y1);
        }

        f = (frequency += slide += deltaSlide) *// frequency
            Math.cos(modulation*tm++);          // modulation
        t += f + f*noise*Math.sin(i**5);        // noise

        if (j && ++j > pitchJumpTime)           // pitch jump
        { 
            frequency += pitchJump;             // apply pitch jump
            startFrequency += pitchJump;        // also apply to start
            j = 0;                              // stop pitch jump time
        } 

        if (repeatTime && !(++r % repeatTime))  // repeat
        { 
            frequency = startFrequency;         // reset frequency
            slide = startSlide;                 // reset slide
            j = j || 1;                         // reset pitch jump time
        }
    }

    return b;
}
/** 
 * LittleJS Tile Layer System
 * - Caches arrays of tiles to off screen canvas for fast rendering
 * - Unlimited numbers of layers, allocates canvases as needed
 * - Interfaces with EngineObject for collision
 * - Collision layer is separate from visible layers
 * - It is recommended to have a visible layer that matches the collision
 * - Tile layers can be drawn to using their context with canvas2d
 * - Drawn directly to the main canvas without using WebGL
 * @namespace TileCollision
 */



/** The tile collision layer array, use setTileCollisionData and getTileCollisionData to access
 *  @type {Array} 
 *  @memberof TileCollision */
let tileCollision = [];

/** Size of the tile collision layer
 *  @type {Vector2} 
 *  @memberof TileCollision */
let tileCollisionSize = vec2();

/** Clear and initialize tile collision
 *  @param {Vector2} size
 *  @memberof TileCollision */
function initTileCollision(size)
{
    tileCollisionSize = size;
    tileCollision = [];
    for (let i=tileCollision.length = tileCollisionSize.area(); i--;)
        tileCollision[i] = 0;
}

/** Set tile collision data
 *  @param {Vector2} pos
 *  @param {Number}  [data]
 *  @memberof TileCollision */
function setTileCollisionData(pos, data=0)
{
    pos.arrayCheck(tileCollisionSize) && (tileCollision[(pos.y|0)*tileCollisionSize.x+pos.x|0] = data);
}

/** Get tile collision data
 *  @param {Vector2} pos
 *  @return {Number}
 *  @memberof TileCollision */
function getTileCollisionData(pos)
{
    return pos.arrayCheck(tileCollisionSize) ? tileCollision[(pos.y|0)*tileCollisionSize.x+pos.x|0] : 0;
}

/** Check if collision with another object should occur
 *  @param {Vector2}      pos
 *  @param {Vector2}      [size=(0,0)]
 *  @param {EngineObject} [object]
 *  @return {Boolean}
 *  @memberof TileCollision */
function tileCollisionTest(pos, size=vec2(), object)
{
    const minX = max(pos.x - size.x/2|0, 0);
    const minY = max(pos.y - size.y/2|0, 0);
    const maxX = min(pos.x + size.x/2, tileCollisionSize.x);
    const maxY = min(pos.y + size.y/2, tileCollisionSize.y);
    for (let y = minY; y < maxY; ++y)
    for (let x = minX; x < maxX; ++x)
    {
        const tileData = tileCollision[y*tileCollisionSize.x+x];
        if (tileData && (!object || object.collideWithTile(tileData, vec2(x, y))))
            return true;
    }
}

/** Return the center of first tile hit (does not return the exact intersection)
 *  @param {Vector2}      posStart
 *  @param {Vector2}      posEnd
 *  @param {EngineObject} [object]
 *  @return {Vector2}
 *  @memberof TileCollision */
function tileCollisionRaycast(posStart, posEnd, object)
{
    // test if a ray collides with tiles from start to end
    // todo: a way to get the exact hit point, it must still be inside the hit tile
    const delta = posEnd.subtract(posStart);
    const totalLength = delta.length();
    const normalizedDelta = delta.normalize();
    const unit = vec2(abs(1/normalizedDelta.x), abs(1/normalizedDelta.y));
    const flooredPosStart = posStart.floor();

    // setup iteration variables
    let pos = flooredPosStart;
    let xi = unit.x * (delta.x < 0 ? posStart.x - pos.x : pos.x - posStart.x + 1);
    let yi = unit.y * (delta.y < 0 ? posStart.y - pos.y : pos.y - posStart.y + 1);

    while (1)
    {
        // check for tile collision
        const tileData = getTileCollisionData(pos);
        if (tileData && (!object || object.collideWithTile(tileData, pos)))
        {
            debugRaycast && debugLine(posStart, posEnd, '#f00', .02);
            debugRaycast && debugPoint(pos.add(vec2(.5)), '#ff0');
            return pos.add(vec2(.5));
        }

        // check if past the end
        if (xi > totalLength && yi > totalLength)
            break;

        // get coordinates of the next tile to check
        if (xi > yi)
            pos.y += sign(delta.y), yi += unit.y;
        else
            pos.x += sign(delta.x), xi += unit.x;
    }

    debugRaycast && debugLine(posStart, posEnd, '#00f', .02);
}

///////////////////////////////////////////////////////////////////////////////
// Tile Layer Rendering System

/**
 * Tile layer data object stores info about how to render a tile
 * @example
 * // create tile layer data with tile index 0 and random orientation and color
 * const tileIndex = 0;
 * const direction = randInt(4)
 * const mirror = randInt(2);
 * const color = randColor();
 * const data = new TileLayerData(tileIndex, direction, mirror, color);
 */
class TileLayerData
{
    /** Create a tile layer data object, one for each tile in a TileLayer
     *  @param {Number}  [tile]      - The tile to use, untextured if undefined
     *  @param {Number}  [direction] - Integer direction of tile, in 90 degree increments
     *  @param {Boolean} [mirror]    - If the tile should be mirrored along the x axis
     *  @param {Color}   [color]     - Color of the tile */
    constructor(tile, direction=0, mirror=false, color=new Color)
    {
        /** @property {Number}  - The tile to use, untextured if undefined */
        this.tile      = tile;
        /** @property {Number}  - Integer direction of tile, in 90 degree increments */
        this.direction = direction;
        /** @property {Boolean} - If the tile should be mirrored along the x axis */
        this.mirror    = mirror;
        /** @property {Color}   - Color of the tile */
        this.color     = color;
    }

    /** Set this tile to clear, it will not be rendered */
    clear() { this.tile = this.direction = 0; this.mirror = false; this.color = new Color; }
}

/**
 * Tile Layer - cached rendering system for tile layers
 * - Each Tile layer is rendered to an off screen canvas
 * - To allow dynamic modifications, layers are rendered using canvas 2d
 * - Some devices like mobile phones are limited to 4k texture resolution
 * - So with 16x16 tiles this limits layers to 256x256 on mobile devices
 * @extends EngineObject
 * @example
 * // create tile collision and visible tile layer
 * initTileCollision(vec2(200,100));
 * const tileLayer = new TileLayer();
 */
class TileLayer extends EngineObject
{
    /** Create a tile layer object
    *  @param {Vector2}  [position=(0,0)]     - World space position
    *  @param {Vector2}  [size=tileCollisionSize] - World space size
    *  @param {TileInfo} [tileInfo]    - Tile info for layer
    *  @param {Vector2}  [scale=(1,1)] - How much to scale this layer when rendered
    *  @param {Number}   [renderOrder] - Objects are sorted by renderOrder
    */
    constructor(position, size=tileCollisionSize, tileInfo=tile(), scale=vec2(1), renderOrder=0)
    {
        super(position, size, tileInfo, 0, undefined, renderOrder);

        /** @property {HTMLCanvasElement} - The canvas used by this tile layer */
        this.canvas = document.createElement('canvas');
        /** @property {CanvasRenderingContext2D} - The 2D canvas context used by this tile layer */
        this.context = this.canvas.getContext('2d');
        /** @property {Vector2} - How much to scale this layer when rendered */
        this.scale = scale;
        /** @property {Boolean} - If true this layer will render to overlay canvas and appear above all objects */
        this.isOverlay = false;

        // init tile data
        this.data = [];
        for (let j = this.size.area(); j--;)
            this.data.push(new TileLayerData);
    }
    
    /** Set data at a given position in the array 
     *  @param {Vector2}       layerPos - Local position in array
     *  @param {TileLayerData} data     - Data to set
     *  @param {Boolean}       [redraw] - Force the tile to redraw if true */
    setData(layerPos, data, redraw=false)
    {
        if (layerPos.arrayCheck(this.size))
        {
            this.data[(layerPos.y|0)*this.size.x+layerPos.x|0] = data;
            redraw && this.drawTileData(layerPos);
        }
    }
    
    /** Get data at a given position in the array 
     *  @param {Vector2} layerPos - Local position in array
     *  @return {TileLayerData} */
    getData(layerPos)
    { return layerPos.arrayCheck(this.size) && this.data[(layerPos.y|0)*this.size.x+layerPos.x|0]; }
    
    // Tile layers are not updated
    update() {}

    // Render the tile layer, called automatically by the engine
    render()
    {
        ASSERT(mainContext != this.context, 'must call redrawEnd() after drawing tiles');
        
        // draw the entire cached level onto the canvas
        const pos = worldToScreen(this.pos.add(vec2(0,this.size.y*this.scale.y)));
        (this.isOverlay ? overlayContext : mainContext).drawImage
        (
            this.canvas, pos.x, pos.y,
            cameraScale*this.size.x*this.scale.x, cameraScale*this.size.y*this.scale.y
        );
    }

    /** Draw all the tile data to an offscreen canvas 
     *  - This may be slow in some browsers but only needs to be done once */
    redraw()
    {
        this.redrawStart(true);
        for (let x = this.size.x; x--;)
        for (let y = this.size.y; y--;)
            this.drawTileData(vec2(x,y), false);
        this.redrawEnd();
    }

    /** Call to start the redraw process
     *  - This can be used to manually update small parts of the level
     *  @param {Boolean} [clear] - Should it clear the canvas before drawing */
    redrawStart(clear=false)
    {
        // save current render settings
        /** @type {[HTMLCanvasElement, CanvasRenderingContext2D, Vector2, Vector2, number]} */
        this.savedRenderSettings = [mainCanvas, mainContext, mainCanvasSize, cameraPos, cameraScale];

        // use webgl rendering system to render the tiles if enabled
        // this works by temporally taking control of the rendering system
        mainCanvas = this.canvas;
        mainContext = this.context;
        mainCanvasSize = this.size.multiply(this.tileInfo.size);
        cameraPos = this.size.scale(.5);
        cameraScale = this.tileInfo.size.x;

        if (clear)
        {
            // clear and set size
            mainCanvas.width  = mainCanvasSize.x;
            mainCanvas.height = mainCanvasSize.y;
        }

        // disable smoothing for pixel art
        this.context.imageSmoothingEnabled = !canvasPixelated;

        // setup gl rendering if enabled
        glPreRender();
    }

    /** Call to end the redraw process */
    redrawEnd()
    {
        ASSERT(mainContext == this.context, 'must call redrawStart() before drawing tiles');
        glCopyToContext(mainContext, true);
        //debugSaveCanvas(this.canvas);

        // set stuff back to normal
        [mainCanvas, mainContext, mainCanvasSize, cameraPos, cameraScale] = this.savedRenderSettings;
    }

    /** Draw the tile at a given position in the tile grid
     *  This can be used to clear out tiles when they are destroyed
     *  Tiles can also be redrawn if isinde a redrawStart/End block
     *  @param {Vector2} layerPos 
     *  @param {Boolean} [clear] - should the old tile be cleared out
     */
    drawTileData(layerPos, clear=true)
    {
        // clear out where the tile was, for full opaque tiles this can be skipped
        const s = this.tileInfo.size;
        if (clear)
        {
            const pos = layerPos.multiply(s);
            this.context.clearRect(pos.x, this.canvas.height-pos.y, s.x, -s.y);
        }

        // draw the tile if not undefined
        const d = this.getData(layerPos);
        if (d.tile != undefined)
        {
            const pos = this.pos.add(layerPos).add(vec2(.5));
            ASSERT(mainContext == this.context, 'must call redrawStart() before drawing tiles');
            const tileInfo = tile(d.tile, s, this.tileInfo.textureIndex);
            drawTile(pos, vec2(1), tileInfo, d.color, d.direction*PI/2, d.mirror);
        }
    }

    /** Draw directly to the 2D canvas in world space (bipass webgl)
     *  @param {Vector2}  pos
     *  @param {Vector2}  size
     *  @param {Number}   angle
     *  @param {Boolean}  mirror
     *  @param {Function} drawFunction */
    drawCanvas2D(pos, size, angle, mirror, drawFunction)
    {
        const context = this.context;
        context.save();
        pos = pos.subtract(this.pos).multiply(this.tileInfo.size);
        size = size.multiply(this.tileInfo.size);
        context.translate(pos.x, this.canvas.height - pos.y);
        context.rotate(angle);
        context.scale(mirror ? -size.x : size.x, size.y);
        drawFunction(context);
        context.restore();
    }

    /** Draw a tile directly onto the layer canvas in world space
     *  @param {Vector2}  pos
     *  @param {Vector2}  [size=(1,1)]
     *  @param {TileInfo} [tileInfo]
     *  @param {Color}    [color=(1,1,1,1)]
     *  @param {Number}   [angle=0]
     *  @param {Boolean}  [mirror=0] */
    drawTile(pos, size=vec2(1), tileInfo, color=new Color, angle, mirror)
    {
        this.drawCanvas2D(pos, size, angle, mirror, (context)=>
        {
            const textureInfo = tileInfo && tileInfo.getTextureInfo();
            if (textureInfo)
            {
                context.globalAlpha = color.a; // only alpha is supported
                context.drawImage(textureInfo.image, 
                    tileInfo.pos.x,  tileInfo.pos.y, 
                    tileInfo.size.x, tileInfo.size.y, -.5, -.5, 1, 1);
                context.globalAlpha = 1;
            }
            else
            {
                // untextured
                context.fillStyle = color;
                context.fillRect(-.5, -.5, 1, 1);
            }
        });
    }

    /** Draw a rectangle directly onto the layer canvas in world space
     *  @param {Vector2} pos
     *  @param {Vector2} [size=(1,1)]
     *  @param {Color}   [color=(1,1,1,1)]
     *  @param {Number}  [angle=0] */
    drawRect(pos, size, color, angle) 
    { this.drawTile(pos, size, undefined, color, angle); }
}
/** 
 * LittleJS Particle System
 */



/**
 * Particle Emitter - Spawns particles with the given settings
 * @extends EngineObject
 * @example
 * // create a particle emitter
 * let pos = vec2(2,3);
 * let particleEmitter = new ParticleEmitter
 * (
 *     pos, 0, 1, 0, 500, PI,      // pos, angle, emitSize, emitTime, emitRate, emiteCone
 *     tile(0, 16),                // tileInfo
 *     rgb(1,1,1),   rgb(0,0,0),   // colorStartA, colorStartB
 *     rgb(1,1,1,0), rgb(0,0,0,0), // colorEndA, colorEndB
 *     2, .2, .2, .1, .05,  // particleTime, sizeStart, sizeEnd, particleSpeed, particleAngleSpeed
 *     .99, 1, 1, PI, .05,  // damping, angleDamping, gravityScale, particleCone, fadeRate, 
 *     .5, 1                // randomness, collide, additive, randomColorLinear, renderOrder
 * );
 */
class ParticleEmitter extends EngineObject
{
    /** Create a particle system with the given settings
     *  @param {Vector2} position - World space position of the emitter
     *  @param {Number} [angle] - Angle to emit the particles
     *  @param {Number|Vector2}  [emitSize] - World space size of the emitter (float for circle diameter, vec2 for rect)
     *  @param {Number} [emitTime] - How long to stay alive (0 is forever)
     *  @param {Number} [emitRate] - How many particles per second to spawn, does not emit if 0
     *  @param {Number} [emitConeAngle=PI] - Local angle to apply velocity to particles from emitter
     *  @param {TileInfo} [tileInfo] - Tile info to render particles (undefined is untextured)
     *  @param {Color} [colorStartA=(1,1,1,1)] - Color at start of life 1, randomized between start colors
     *  @param {Color} [colorStartB=(1,1,1,1)] - Color at start of life 2, randomized between start colors
     *  @param {Color} [colorEndA=(1,1,1,0)] - Color at end of life 1, randomized between end colors
     *  @param {Color} [colorEndB=(1,1,1,0)] - Color at end of life 2, randomized between end colors
     *  @param {Number} [particleTime]      - How long particles live
     *  @param {Number} [sizeStart]         - How big are particles at start
     *  @param {Number} [sizeEnd]           - How big are particles at end
     *  @param {Number} [speed]             - How fast are particles when spawned
     *  @param {Number} [angleSpeed]        - How fast are particles rotating
     *  @param {Number} [damping]           - How much to dampen particle speed
     *  @param {Number} [angleDamping]      - How much to dampen particle angular speed
     *  @param {Number} [gravityScale]      - How much gravity effect particles
     *  @param {Number} [particleConeAngle] - Cone for start particle angle
     *  @param {Number} [fadeRate]          - How quick to fade particles at start/end in percent of life
     *  @param {Number} [randomness]    - Apply extra randomness percent
     *  @param {Boolean} [collideTiles] - Do particles collide against tiles
     *  @param {Boolean} [additive]     - Should particles use addtive blend
     *  @param {Boolean} [randomColorLinear] - Should color be randomized linearly or across each component
     *  @param {Number} [renderOrder] - Render order for particles (additive is above other stuff by default)
     *  @param {Boolean}  [localSpace] - Should it be in local space of emitter (world space is default)
     */
    constructor
    ( 
        position,
        angle,
        emitSize = 0,
        emitTime = 0,
        emitRate = 100,
        emitConeAngle = PI,
        tileInfo,
        colorStartA = new Color,
        colorStartB = new Color,
        colorEndA = new Color(1,1,1,0),
        colorEndB = new Color(1,1,1,0),
        particleTime = .5,
        sizeStart = .1,
        sizeEnd = 1,
        speed = .1,
        angleSpeed = .05,
        damping = 1,
        angleDamping = 1,
        gravityScale = 0,
        particleConeAngle = PI,
        fadeRate = .1,
        randomness = .2, 
        collideTiles = false,
        additive = false,
        randomColorLinear = true,
        renderOrder = additive ? 1e9 : 0,
        localSpace = false
    )
    {
        super(position, vec2(), tileInfo, angle, undefined, renderOrder);

        // emitter settings
        /** @property {Number|Vector2} - World space size of the emitter (float for circle diameter, vec2 for rect) */
        this.emitSize = emitSize;
        /** @property {Number} - How long to stay alive (0 is forever) */
        this.emitTime = emitTime;
        /** @property {Number} - How many particles per second to spawn, does not emit if 0 */
        this.emitRate = emitRate;
        /** @property {Number} - Local angle to apply velocity to particles from emitter */
        this.emitConeAngle = emitConeAngle;

        // color settings
        /** @property {Color} - Color at start of life 1, randomized between start colors */
        this.colorStartA = colorStartA;
        /** @property {Color} - Color at start of life 2, randomized between start colors */
        this.colorStartB = colorStartB;
        /** @property {Color} - Color at end of life 1, randomized between end colors */
        this.colorEndA   = colorEndA;
        /** @property {Color} - Color at end of life 2, randomized between end colors */
        this.colorEndB   = colorEndB;
        /** @property {Boolean} - Should color be randomized linearly or across each component */
        this.randomColorLinear = randomColorLinear;

        // particle settings
        /** @property {Number} - How long particles live */
        this.particleTime      = particleTime;
        /** @property {Number} - How big are particles at start */
        this.sizeStart         = sizeStart;
        /** @property {Number} - How big are particles at end */
        this.sizeEnd           = sizeEnd;
        /** @property {Number} - How fast are particles when spawned */
        this.speed             = speed;
        /** @property {Number} - How fast are particles rotating */
        this.angleSpeed        = angleSpeed;
        /** @property {Number} - How much to dampen particle speed */
        this.damping           = damping;
        /** @property {Number} - How much to dampen particle angular speed */
        this.angleDamping      = angleDamping;
        /** @property {Number} - How much does gravity effect particles */
        this.gravityScale      = gravityScale;
        /** @property {Number} - Cone for start particle angle */
        this.particleConeAngle = particleConeAngle;
        /** @property {Number} - How quick to fade in particles at start/end in percent of life */
        this.fadeRate          = fadeRate;
        /** @property {Number} - Apply extra randomness percent */
        this.randomness        = randomness;
        /** @property {Boolean} - Do particles collide against tiles */
        this.collideTiles      = collideTiles;
        /** @property {Boolean} - Should particles use addtive blend */
        this.additive          = additive;
        /** @property {Boolean} - Should it be in local space of emitter */
        this.localSpace        = localSpace;
        /** @property {Number} - If non zero the partile is drawn as a trail, stretched in the drection of velocity */
        this.trailScale        = 0;
        /** @property {Function}   - Callback when particle is destroyed */
        this.particleDestroyCallback = undefined;
        /** @property {Function}   - Callback when particle is created */
        this.particleCreateCallback = undefined;
        /** @property {Number} - Track particle emit time */
        this.emitTimeBuffer    = 0;
    }
    
    /** Update the emitter to spawn particles, called automatically by engine once each frame */
    update()
    {
        // only do default update to apply parent transforms
        this.parent && super.update();

        // update emitter
        if (!this.emitTime || this.getAliveTime() <= this.emitTime)
        {
            // emit particles
            if (this.emitRate * particleEmitRateScale)
            {
                const rate = 1/this.emitRate/particleEmitRateScale;
                for (this.emitTimeBuffer += timeDelta; this.emitTimeBuffer > 0; this.emitTimeBuffer -= rate)
                    this.emitParticle();
            }
        }
        else
            this.destroy();

        debugParticles && debugRect(this.pos, vec2(this.emitSize), '#0f0', 0, this.angle);
    }

    /** Spawn one particle
     *  @return {Particle} */
    emitParticle()
    {
        // spawn a particle
        let pos = typeof this.emitSize === 'number' ? // check if number was used
            randInCircle(this.emitSize/2)              // circle emitter
            : vec2(rand(-.5,.5), rand(-.5,.5))         // box emitter
                .multiply(this.emitSize).rotate(this.angle);
        let angle = rand(this.particleConeAngle, -this.particleConeAngle);
        if (!this.localSpace)
        {
            pos = this.pos.add(pos);
            angle += this.angle;
        }

        // randomness scales each paremeter by a percentage
        const randomness = this.randomness;
        const randomizeScale = (v)=> v + v*rand(randomness, -randomness);

        // randomize particle settings
        const particleTime  = randomizeScale(this.particleTime);
        const sizeStart     = randomizeScale(this.sizeStart);
        const sizeEnd       = randomizeScale(this.sizeEnd);
        const speed         = randomizeScale(this.speed);
        const angleSpeed    = randomizeScale(this.angleSpeed) * randSign();
        const coneAngle     = rand(this.emitConeAngle, -this.emitConeAngle);
        const colorStart    = randColor(this.colorStartA, this.colorStartB, this.randomColorLinear);
        const colorEnd      = randColor(this.colorEndA,   this.colorEndB, this.randomColorLinear);
        const velocityAngle = this.localSpace ? coneAngle : this.angle + coneAngle;
        
        // build particle
        const particle = new Particle(pos, this.tileInfo, angle, colorStart, colorEnd, particleTime, sizeStart, sizeEnd, this.fadeRate, this.additive,  this.trailScale, this.localSpace && this, this.particleDestroyCallback);
        particle.velocity      = vec2().setAngle(velocityAngle, speed);
        particle.angleVelocity = angleSpeed;
        particle.fadeRate      = this.fadeRate;
        particle.damping       = this.damping;
        particle.angleDamping  = this.angleDamping;
        particle.elasticity    = this.elasticity;
        particle.friction      = this.friction;
        particle.gravityScale  = this.gravityScale;
        particle.collideTiles  = this.collideTiles;
        particle.renderOrder   = this.renderOrder;
        particle.mirror        = !!randInt(2);

        // call particle create callaback
        this.particleCreateCallback && this.particleCreateCallback(particle);

        // return the newly created particle
        return particle;
    }

    // Particle emitters are not rendered, only the particles are
    render() {}
}

///////////////////////////////////////////////////////////////////////////////
/**
 * Particle Object - Created automatically by Particle Emitters
 * @extends EngineObject
 */
class Particle extends EngineObject
{
    /**
     * Create a particle with the given shis.colorStart = undefined;ettings
     * @param {Vector2}  position     - World space position of the particle
     * @param {TileInfo} [tileInfo]   - Tile info to render particles
     * @param {Number}   [angle]      - Angle to rotate the particle
     * @param {Color}    [colorStart] - Color at start of life
     * @param {Color}    [colorEnd]   - Color at end of life
     * @param {Number}   [lifeTime]   - How long to live for
     * @param {Number}   [sizeStart]  - Angle to rotate the particle
     * @param {Number}   [sizeEnd]    - Angle to rotate the particle
     * @param {Number}   [fadeRate]   - Angle to rotate the particle
     * @param {Boolean}  [additive]   - Angle to rotate the particle
     * @param {Number}   [trailScale] - If a trail, how long to make it
     * @param {ParticleEmitter} [localSpaceEmitter] - Parent emitter if local space
     * @param {Function}  [destroyCallback] - Called when particle dies
     */
    constructor(position, tileInfo, angle, colorStart, colorEnd, lifeTime, sizeStart, sizeEnd, fadeRate, additive, trailScale, localSpaceEmitter, destroyCallback
    )
    { 
        super(position, vec2(), tileInfo, angle); 
    
        /** @property {Color} - Color at start of life */
        this.colorStart = colorStart;
        /** @property {Color} - Calculated change in color */
        this.colorEndDelta = colorEnd.subtract(colorStart);
        /** @property {Number} - How long to live for */
        this.lifeTime = lifeTime;
        /** @property {Number} - Size at start of life */
        this.sizeStart = sizeStart;
        /** @property {Number} - Calculated change in size */
        this.sizeEndDelta = sizeEnd - sizeStart;
        /** @property {Number} - How quick to fade in/out */
        this.fadeRate = fadeRate;
        /** @property {Boolean} - Is it additive */
        this.additive = additive;
        /** @property {Number} - If a trail, how long to make it */
        this.trailScale = trailScale;
        /** @property {ParticleEmitter} - Parent emitter if local space */
        this.localSpaceEmitter = localSpaceEmitter;
        /** @property {Function} - Called when particle dies */
        this.destroyCallback = destroyCallback;
    }

    /** Render the particle, automatically called each frame, sorted by renderOrder */
    render()
    {
        // modulate size and color
        const p = min((time - this.spawnTime) / this.lifeTime, 1);
        const radius = this.sizeStart + p * this.sizeEndDelta;
        const size = vec2(radius);
        const fadeRate = this.fadeRate/2;
        const color = new Color(
            this.colorStart.r + p * this.colorEndDelta.r,
            this.colorStart.g + p * this.colorEndDelta.g,
            this.colorStart.b + p * this.colorEndDelta.b,
            (this.colorStart.a + p * this.colorEndDelta.a) * 
             (p < fadeRate ? p/fadeRate : p > 1-fadeRate ? (1-p)/fadeRate : 1)); // fade alpha

        // draw the particle
        this.additive && setBlendMode(true);

        let pos = this.pos, angle = this.angle;
        if (this.localSpaceEmitter)
        {
            // in local space of emitter
            pos = this.localSpaceEmitter.pos.add(pos.rotate(-this.localSpaceEmitter.angle)); 
            angle += this.localSpaceEmitter.angle;
        }
        if (this.trailScale)
        {
            // trail style particles
            let velocity = this.velocity;
            if (this.localSpaceEmitter)
                velocity = velocity.rotate(-this.localSpaceEmitter.angle);
            const speed = velocity.length();
            if (speed)
            {
                const direction = velocity.scale(1/speed);
                const trailLength = speed * this.trailScale;
                size.y = max(size.x, trailLength);
                angle = direction.angle();
                drawTile(pos.add(direction.multiply(vec2(0,-trailLength/2))), size, this.tileInfo, color, angle, this.mirror);
            }
        }
        else
            drawTile(pos, size, this.tileInfo, color, angle, this.mirror);
        this.additive && setBlendMode();
        debugParticles && debugRect(pos, size, '#f005', 0, angle);

        if (p == 1)
        {
            // destroy particle when it's time runs out
            this.color = color;
            this.size = size;
            this.destroyCallback && this.destroyCallback(this);
            this.destroyed = 1;
        }
    }
}

// Engine internal variables not exposed to documentation
let medalsDisplayQueue = [], medalsDisplayTimeLast;

// engine automatically renders medals
function medalsRender()
{
    if (!medalsDisplayQueue.length)
        return;
    
    // update first medal in queue
    const medal = medalsDisplayQueue[0];
    const time = timeReal - medalsDisplayTimeLast;
    if (!medalsDisplayTimeLast)
        medalsDisplayTimeLast = timeReal;
    else if (time > medalDisplayTime)
    {
        medalsDisplayTimeLast = 0;
        medalsDisplayQueue.shift();
    }
    else
    {
        // slide on/off medals
        const slideOffTime = medalDisplayTime - medalDisplaySlideTime;
        const hidePercent = 
            time < medalDisplaySlideTime ? 1 - time / medalDisplaySlideTime :
            time > slideOffTime ? (time - slideOffTime) / medalDisplaySlideTime : 0;
        medal.render(hidePercent);
    }
}
/**
 * LittleJS WebGL Interface
 * - All webgl used by the engine is wrapped up here
 * - For normal stuff you won't need to see or call anything in this file
 * - For advanced stuff there are helper functions to create shaders, textures, etc
 * - Can be disabled with glEnable to revert to 2D canvas rendering
 * - Batches sprite rendering on GPU for incredibly fast performance
 * - Sprite transform math is done in the shader where possible
 * - Supports shadertoy style post processing shaders
 * @namespace WebGL
 */



/** The WebGL canvas which appears above the main canvas and below the overlay canvas
 *  @type {HTMLCanvasElement}
 *  @memberof WebGL */
let glCanvas;

/** 2d context for glCanvas
 *  @type {WebGL2RenderingContext}
 *  @memberof WebGL */
let glContext;

// WebGL internal variables not exposed to documentation
let glShader, glActiveTexture, glArrayBuffer, glGeometryBuffer, glPositionData, glColorData, glInstanceCount, glAdditive, glBatchAdditive;

///////////////////////////////////////////////////////////////////////////////

// Initalize WebGL, called automatically by the engine
function glInit()
{
    // create the canvas and textures
    glCanvas = document.createElement('canvas');
    glContext = glCanvas.getContext('webgl2');

    // some browsers are much faster without copying the gl buffer so we just overlay it instead
    document.body.appendChild(glCanvas);

    // setup vertex and fragment shaders
    glShader = glCreateProgram(
        '#version 300 es\n' +     // specify GLSL ES version
        'precision highp float;'+ // use highp for better accuracy
        'uniform mat4 m;'+        // transform matrix
        'in vec2 g;'+             // geometry
        'in vec4 p,u,c,a;'+       // position/size, uvs, color, additiveColor
        'in float r;'+            // rotation
        'out vec2 v;'+            // return uv, color, additiveColor
        'out vec4 d,e;'+          // return uv, color, additiveColor
        'void main(){'+           // shader entry point
        'vec2 s=(g-.5)*p.zw;'+    // get size offset
        'gl_Position=m*vec4(p.xy+s*cos(r)-vec2(-s.y,s)*sin(r),1,1);'+ // transform position
        'v=mix(u.xw,u.zy,g);'+    // pass uv to fragment shader
        'd=c;e=a;'+               // pass colors to fragment shader
        '}'                       // end of shader
        ,
        '#version 300 es\n' +     // specify GLSL ES version
        'precision highp float;'+ // use highp for better accuracy
        'in vec2 v;'+             // uv
        'in vec4 d,e;'+           // color, additiveColor
        'uniform sampler2D s;'+   // texture
        'out vec4 c;'+            // out color
        'void main(){'+           // shader entry point
        'c=texture(s,v)*d+e;'+    // modulate texture by color plus additive
        '}'                       // end of shader
    );

    // init buffers
    const glInstanceData = new ArrayBuffer(gl_INSTANCE_BUFFER_SIZE);
    glPositionData = new Float32Array(glInstanceData);
    glColorData = new Uint32Array(glInstanceData);
    glArrayBuffer = glContext.createBuffer();
    glGeometryBuffer = glContext.createBuffer();

    // create the geometry buffer, triangle strip square
    const geometry = new Float32Array([glInstanceCount=0,0,1,0,0,1,1,1]);
    glContext.bindBuffer(gl_ARRAY_BUFFER, glGeometryBuffer);
    glContext.bufferData(gl_ARRAY_BUFFER, geometry, gl_STATIC_DRAW);
}

// Setup render each frame, called automatically by engine
function glPreRender()
{
    // clear and set to same size as main canvas
    glContext.viewport(0, 0, glCanvas.width=mainCanvas.width, glCanvas.height=mainCanvas.height);
    glContext.clear(gl_COLOR_BUFFER_BIT);

    // set up the shader
    glContext.useProgram(glShader);
    glContext.activeTexture(gl_TEXTURE0);
    glContext.bindTexture(gl_TEXTURE_2D, glActiveTexture = textureInfos[0].glTexture);

    // set vertex attributes
    let offset = glAdditive = glBatchAdditive = 0;
    let initVertexAttribArray = (name, type, typeSize, size)=>
    {
        const location = glContext.getAttribLocation(glShader, name);
        const stride = typeSize && gl_INSTANCE_BYTE_STRIDE; // only if not geometry
        const divisor = typeSize && 1; // only if not geometry
        const normalize = typeSize==1; // only if color
        glContext.enableVertexAttribArray(location);
        glContext.vertexAttribPointer(location, size, type, normalize, stride, offset);
        glContext.vertexAttribDivisor(location, divisor);
        offset += size*typeSize;
    };
    glContext.bindBuffer(gl_ARRAY_BUFFER, glGeometryBuffer);
    initVertexAttribArray('g', gl_FLOAT, 0, 2); // geometry
    glContext.bindBuffer(gl_ARRAY_BUFFER, glArrayBuffer);
    glContext.bufferData(gl_ARRAY_BUFFER, gl_INSTANCE_BUFFER_SIZE, gl_DYNAMIC_DRAW);
    initVertexAttribArray('p', gl_FLOAT, 4, 4); // position & size
    initVertexAttribArray('u', gl_FLOAT, 4, 4); // texture coords
    initVertexAttribArray('c', gl_UNSIGNED_BYTE, 1, 4); // color
    initVertexAttribArray('a', gl_UNSIGNED_BYTE, 1, 4); // additiveColor
    initVertexAttribArray('r', gl_FLOAT, 4, 1); // rotation

    // build the transform matrix
    const s = vec2(2*cameraScale).divide(mainCanvasSize);
    const p = vec2(-1).subtract(cameraPos.multiply(s));
    glContext.uniformMatrix4fv(glContext.getUniformLocation(glShader, 'm'), false,
        new Float32Array([
            s.x, 0,   0,   0,
            0,   s.y, 0,   0,
            1,   1,   1,   1,
            p.x, p.y, 0,   0
        ])
    );
}

/** Set the WebGl texture, called automatically if using multiple textures
 *  - This may also flush the gl buffer resulting in more draw calls and worse performance
 *  @param {WebGLTexture} texture
 *  @memberof WebGL */
function glSetTexture(texture)
{
    // must flush cache with the old texture to set a new one
    if (texture == glActiveTexture)
        return;

    glFlush();
    glContext.bindTexture(gl_TEXTURE_2D, glActiveTexture = texture);
}

/** Compile WebGL shader of the given type, will throw errors if in debug mode
 *  @param {String} source
 *  @param {Number} type
 *  @return {WebGLShader}
 *  @memberof WebGL */
function glCompileShader(source, type)
{
    // build the shader
    const shader = glContext.createShader(type);
    glContext.shaderSource(shader, source);
    glContext.compileShader(shader);

    // check for errors
    if (!glContext.getShaderParameter(shader, gl_COMPILE_STATUS))
        throw glContext.getShaderInfoLog(shader);
    return shader;
}

/** Create WebGL program with given shaders
 *  @param {String} vsSource
 *  @param {String} fsSource
 *  @return {WebGLProgram}
 *  @memberof WebGL */
function glCreateProgram(vsSource, fsSource)
{
    // build the program
    const program = glContext.createProgram();
    glContext.attachShader(program, glCompileShader(vsSource, gl_VERTEX_SHADER));
    glContext.attachShader(program, glCompileShader(fsSource, gl_FRAGMENT_SHADER));
    glContext.linkProgram(program);

    // check for errors
    if (!glContext.getProgramParameter(program, gl_LINK_STATUS))
        throw glContext.getProgramInfoLog(program);
    return program;
}

/** Create WebGL texture from an image and init the texture settings
 *  @param {HTMLImageElement} image
 *  @return {WebGLTexture}
 *  @memberof WebGL */
function glCreateTexture(image)
{
    // build the texture
    const texture = glContext.createTexture();
    glContext.bindTexture(gl_TEXTURE_2D, texture);
    if (image)
        glContext.texImage2D(gl_TEXTURE_2D, 0, gl_RGBA, gl_RGBA, gl_UNSIGNED_BYTE, image);

    // use point filtering for pixelated rendering
    const filter = gl_NEAREST ;
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MIN_FILTER, filter);
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MAG_FILTER, filter);

    return texture;
}

/** Draw all sprites and clear out the buffer, called automatically by the system whenever necessary
 *  @memberof WebGL */
function glFlush()
{
    if (!glInstanceCount) return;

    const destBlend = glBatchAdditive ? gl_ONE : gl_ONE_MINUS_SRC_ALPHA;
    glContext.blendFuncSeparate(gl_SRC_ALPHA, destBlend, gl_ONE, destBlend);
    glContext.enable(gl_BLEND);

    // draw all the sprites in the batch and reset the buffer
    glContext.bufferSubData(gl_ARRAY_BUFFER, 0, glPositionData);
    glContext.drawArraysInstanced(gl_TRIANGLE_STRIP, 0, 4, glInstanceCount);
    if (showWatermark)
        drawCount += glInstanceCount;
    glInstanceCount = 0;
    glBatchAdditive = glAdditive;
}

/** Draw any sprites still in the buffer, copy to main canvas and clear
 *  @param {CanvasRenderingContext2D} context
 *  @param {Boolean} [forceDraw]
 *  @memberof WebGL */
function glCopyToContext(context, forceDraw=false)
{
    if (!glInstanceCount && !forceDraw) return;

    glFlush();

    // do not draw in overlay mode because the canvas is visible
    if (forceDraw)
        context.drawImage(glCanvas, 0, 0);
}

/** Add a sprite to the gl draw list, used by all gl draw functions
 *  @param {Number} x
 *  @param {Number} y
 *  @param {Number} sizeX
 *  @param {Number} sizeY
 *  @param {Number} angle
 *  @param {Number} uv0X
 *  @param {Number} uv0Y
 *  @param {Number} uv1X
 *  @param {Number} uv1Y
 *  @param {Number} rgba
 *  @param {Number} [rgbaAdditive=0]
 *  @memberof WebGL */
function glDraw(x, y, sizeX, sizeY, angle, uv0X, uv0Y, uv1X, uv1Y, rgba, rgbaAdditive=0)
{
    ASSERT(typeof rgba == 'number' && typeof rgbaAdditive == 'number', 'invalid color');

    // flush if there is not enough room or if different blend mode
    if (glInstanceCount >= gl_MAX_INSTANCES || glBatchAdditive != glAdditive)
        glFlush();

    let offset = glInstanceCount * gl_INDICIES_PER_INSTANCE;
    glPositionData[offset++] = x;
    glPositionData[offset++] = y;
    glPositionData[offset++] = sizeX;
    glPositionData[offset++] = sizeY;
    glPositionData[offset++] = uv0X;
    glPositionData[offset++] = uv0Y;
    glPositionData[offset++] = uv1X;
    glPositionData[offset++] = uv1Y;
    glColorData[offset++] = rgba;
    glColorData[offset++] = rgbaAdditive;
    glPositionData[offset++] = angle;
    glInstanceCount++;
}

///////////////////////////////////////////////////////////////////////////////
// store gl constants as integers so their name doesn't use space in minifed
const gl_ONE = 1,
gl_TRIANGLE_STRIP = 5,
gl_SRC_ALPHA = 770,
gl_ONE_MINUS_SRC_ALPHA = 771,
gl_BLEND = 3042,
gl_TEXTURE_2D = 3553,
gl_UNSIGNED_BYTE = 5121,
gl_FLOAT = 5126,
gl_RGBA = 6408,
gl_NEAREST = 9728,
gl_TEXTURE_MAG_FILTER = 10240,
gl_TEXTURE_MIN_FILTER = 10241,
gl_COLOR_BUFFER_BIT = 16384,
gl_TEXTURE0 = 33984,
gl_ARRAY_BUFFER = 34962,
gl_STATIC_DRAW = 35044,
gl_DYNAMIC_DRAW = 35048,
gl_FRAGMENT_SHADER = 35632,
gl_VERTEX_SHADER = 35633,
gl_COMPILE_STATUS = 35713,
gl_LINK_STATUS = 35714,
// constants for batch rendering
gl_INDICIES_PER_INSTANCE = 11,
gl_MAX_INSTANCES = 1e4,
gl_INSTANCE_BYTE_STRIDE = gl_INDICIES_PER_INSTANCE * 4, // 11 * 4
gl_INSTANCE_BUFFER_SIZE = gl_MAX_INSTANCES * gl_INSTANCE_BYTE_STRIDE;
/** 
 * LittleJS - The Tiny Fast JavaScript Game Engine
 * MIT License - Copyright 2021 Frank Force
 * 
 * Engine Features
 * - Object oriented system with base class engine object
 * - Base class object handles update, physics, collision, rendering, etc
 * - Engine helper classes and functions like Vector2, Color, and Timer
 * - Super fast rendering system for tile sheets
 * - Sound effects audio with zzfx and music with zzfxm
 * - Input processing system with gamepad and touchscreen support
 * - Tile layer rendering and collision system
 * - Particle effect system
 * - Medal system tracks and displays achievements
 * - Debug tools and debug rendering system
 * - Post processing effects
 * - Call engineInit() to start it up!
 * @namespace Engine
 */



/** Name of engine
 *  @type {String}
 *  @default
 *  @memberof Engine */
const engineName = 'LittleJS';

/** Version of engine
 *  @type {String}
 *  @default
 *  @memberof Engine */
const engineVersion = '1.9.5';

/** Frames per second to update
 *  @type {Number}
 *  @default
 *  @memberof Engine */
const frameRate = 60;

/** How many seconds each frame lasts, engine uses a fixed time step
 *  @type {Number}
 *  @default 1/60
 *  @memberof Engine */
const timeDelta = 1/frameRate;

/** Array containing all engine objects
 *  @type {Array}
 *  @memberof Engine */
let engineObjects = [];

/** Array with only objects set to collide with other objects this frame (for optimization)
 *  @type {Array}
 *  @memberof Engine */
let engineObjectsCollide = [];

/** Current update frame, used to calculate time
 *  @type {Number}
 *  @memberof Engine */
let frame = 0;

/** Current engine time since start in seconds
 *  @type {Number}
 *  @memberof Engine */
let time = 0;

/** Actual clock time since start in seconds (not affected by pause or frame rate clamping)
 *  @type {Number}
 *  @memberof Engine */
let timeReal = 0;

/** Is the game paused? Causes time and objects to not be updated
 *  @type {Boolean}
 *  @default false
 *  @memberof Engine */
let paused = false;

/** Set if game is paused
 *  @param {Boolean} isPaused
 *  @memberof Engine */
function setPaused(isPaused) { paused = isPaused; }

// Frame time tracking
let frameTimeLastMS = 0, frameTimeBufferMS = 0, averageFPS = 0;

///////////////////////////////////////////////////////////////////////////////

/** Startup LittleJS engine with your callback functions
 *  @param {Function} gameInit       - Called once after the engine starts up, setup the game
 *  @param {Function} gameUpdate     - Called every frame at 60 frames per second, handle input and update the game state
 *  @param {Function} gameUpdatePost - Called after physics and objects are updated, setup camera and prepare for render
 *  @param {Function} gameRender     - Called before objects are rendered, draw any background effects that appear behind objects
 *  @param {Function} gameRenderPost - Called after objects are rendered, draw effects or hud that appear above all objects
 *  @param {Array} [imageSources=['tiles.png']] - Image to load
 *  @memberof Engine */
function engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, imageSources=['tiles.png'])
{
    ASSERT(Array.isArray(imageSources), 'pass in images as array');

    // Called automatically by engine to setup render system
    function enginePreRender()
    {
        // save canvas size
        mainCanvasSize = vec2(mainCanvas.width, mainCanvas.height);

        // disable smoothing for pixel art
        mainContext.imageSmoothingEnabled = !canvasPixelated;

        // setup gl rendering if enabled
        glPreRender();
    }

    // internal update loop for engine
    function engineUpdate(frameTimeMS=0)
    {
        // update time keeping
        let frameTimeDeltaMS = frameTimeMS - frameTimeLastMS;
        frameTimeLastMS = frameTimeMS;
        averageFPS = lerp(.05, averageFPS, 1e3/(frameTimeDeltaMS||1));
        const debugSpeedUp   = keyIsDown('Equal'); // +
        const debugSpeedDown = keyIsDown('Minus'); // -
        frameTimeDeltaMS *= debugSpeedUp ? 5 : debugSpeedDown ? .2 : 1;
        timeReal += frameTimeDeltaMS / 1e3;
        frameTimeBufferMS += paused ? 0 : frameTimeDeltaMS;
        if (!debugSpeedUp)
            frameTimeBufferMS = min(frameTimeBufferMS, 50); // clamp in case of slow framerate
        updateCanvas();

        if (paused)
        {
            // do post update even when paused
            inputUpdate();
            debugUpdate();
            gameUpdatePost();
            inputUpdatePost();
        }
        else
        {
            // apply time delta smoothing, improves smoothness of framerate in some browsers
            let deltaSmooth = 0;
            if (frameTimeBufferMS < 0 && frameTimeBufferMS > -9)
            {
                // force an update each frame if time is close enough (not just a fast refresh rate)
                deltaSmooth = frameTimeBufferMS;
                frameTimeBufferMS = 0;
            }
            
            // update multiple frames if necessary in case of slow framerate
            for (;frameTimeBufferMS >= 0; frameTimeBufferMS -= 1e3 / frameRate)
            {
                // increment frame and update time
                time = frame++ / frameRate;

                // update game and objects
                inputUpdate();
                gameUpdate();
                engineObjectsUpdate();

                // do post update
                debugUpdate();
                gameUpdatePost();
                inputUpdatePost();
            }

            // add the time smoothing back in
            frameTimeBufferMS += deltaSmooth;
        }
        
        // render sort then render while removing destroyed objects
        enginePreRender();
        gameRender();
        engineObjects.sort((a,b)=> a.renderOrder - b.renderOrder);
        for (const o of engineObjects)
            o.destroyed || o.render();
        gameRenderPost();
        medalsRender();
        debugRender();
        glCopyToContext(mainContext);

        if (showWatermark)
        {
            // update fps
            overlayContext.textAlign = 'right';
            overlayContext.textBaseline = 'top';
            overlayContext.font = '1em monospace';
            overlayContext.fillStyle = '#000';
            const text = engineName + ' ' + 'v' + engineVersion + ' / ' 
                + drawCount + ' / ' + engineObjects.length + ' / ' + averageFPS.toFixed(1)
                + (' GL' ) ;
            overlayContext.fillText(text, mainCanvas.width-3, 3);
            overlayContext.fillStyle = '#fff';
            overlayContext.fillText(text, mainCanvas.width-2, 2);
            drawCount = 0;
        }

        requestAnimationFrame(engineUpdate);
    }

    function updateCanvas()
    {
        if (canvasFixedSize.x)
        {
            // clear canvas and set fixed size
            mainCanvas.width  = canvasFixedSize.x;
            mainCanvas.height = canvasFixedSize.y;
            
            // fit to window by adding space on top or bottom if necessary
            const aspect = innerWidth / innerHeight;
            const fixedAspect = mainCanvas.width / mainCanvas.height;
            (glCanvas||mainCanvas).style.width = mainCanvas.style.width = overlayCanvas.style.width  = aspect < fixedAspect ? '100%' : '';
            (glCanvas||mainCanvas).style.height = mainCanvas.style.height = overlayCanvas.style.height = aspect < fixedAspect ? '' : '100%';
        }
        else
        {
            // clear canvas and set size to same as window
            mainCanvas.width  = min(innerWidth,  canvasMaxSize.x);
            mainCanvas.height = min(innerHeight, canvasMaxSize.y);
        }
        
        // clear overlay canvas and set size
        overlayCanvas.width  = mainCanvas.width;
        overlayCanvas.height = mainCanvas.height;

        // save canvas size
        mainCanvasSize = vec2(mainCanvas.width, mainCanvas.height);
    }

    // setup html
     const styleBody = 
        'margin:0;overflow:hidden;' + // fill the window
        'background:#000;' +          // set background color
        'touch-action:none;' +        // prevent mobile pinch to resize
        'user-select:none;' +         // prevent mobile hold to select
        '-webkit-user-select:none;' + // compatibility for ios
        '-webkit-touch-callout:none'; // compatibility for ios
    document.body.style.cssText = styleBody;
    document.body.appendChild(mainCanvas = document.createElement('canvas'));
    mainContext = mainCanvas.getContext('2d');

    // init stuff and start engine
    debugInit();
    glInit();

    // create overlay canvas for hud to appear above gl canvas
    document.body.appendChild(overlayCanvas = document.createElement('canvas'));
    overlayContext = overlayCanvas.getContext('2d');

    // set canvas style
    const styleCanvas = 'position:absolute;' +             // position
        'top:50%;left:50%;transform:translate(-50%,-50%)'; // center
    (glCanvas||mainCanvas).style.cssText = mainCanvas.style.cssText = overlayCanvas.style.cssText = styleCanvas;
    updateCanvas();
    
    // create promises for loading images
    const promises = imageSources.map((src, textureIndex)=>
        new Promise(resolve => 
        {
            const image = new Image;
            image.onerror = image.onload = ()=> 
            {
                textureInfos[textureIndex] = new TextureInfo(image);
                resolve();
            };
            image.src = src;
        })
    );

    // load all of the images
    Promise.all(promises).then(()=> 
    {
        // start the engine
        gameInit();
        engineUpdate();
    });
}

/** Update each engine object, remove destroyed objects, and update time
 *  @memberof Engine */
function engineObjectsUpdate()
{
    // get list of solid objects for physics optimzation
    engineObjectsCollide = engineObjects.filter(o=>o.collideSolidObjects);

    // recursive object update
    function updateObject(o)
    {
        if (!o.destroyed)
        {
            o.update();
            for (const child of o.children)
                updateObject(child);
        }
    }
    for (const o of engineObjects)
        o.parent || updateObject(o);

    // remove destroyed objects
    engineObjects = engineObjects.filter(o=>!o.destroyed);
}

/** Destroy and remove all objects
 *  @memberof Engine */
function engineObjectsDestroy()
{
    for (const o of engineObjects)
        o.parent || o.destroy();
    engineObjects = engineObjects.filter(o=>!o.destroyed);
}

class GameObject extends EngineObject {
    constructor(t, pos, size, tileInfo, angle = 0) {
        super(pos, size, tileInfo, angle);
        this.hp = 1;
        this.gameObjectType = t;
        this.damageTimer = new Timer();
    }
    update() {
        super.update();
        // flash white when damaged
        if (!this.isDead() && this.damageTimer.isSet()) {
            const a = 0.5 * percent(this.damageTimer.get(), 0.15, 0);
            this.additiveColor = hsl(0, 0, a, 0);
        }
        else
            this.additiveColor = hsl(0, 0, 0, 0);
    }
    damage(damage) {
        ASSERT(damage >= 0);
        if (this.isDead())
            return 0;
        // set damage timer
        this.damageTimer.set();
        for (const child of this.children)
            child.damageTimer && child.damageTimer.set();
        // apply damage and kill if necessary
        const newHealth = max(this.hp - damage, 0);
        if (!newHealth)
            this.kill();
        // set new health and return amount damaged
        return this.hp - (this.hp = newHealth);
    }
    isDead() {
        return !this.hp;
    }
    kill() {
        this.destroy();
    }
}

const persistentParticleDestroyCallback = (particle) => {
    // copy particle to tile layer on death
    ASSERT(!particle.tileInfo, "quick draw to tile layer uses canvas 2d so must be untextured");
    if (rand() < 0.05 && mainSystem.isItFloor(particle.pos))
        // @ts-ignore
        mainSystem.floorTile.drawTile(particle.pos, particle.size, particle.tileInfo, particle.color, particle.angle, particle.mirror);
};
function makeDebris(pos, color = hsl(), amount = 50, size = 0.2, elasticity = 0.3) {
    const color2 = color.lerp(hsl(), 0.5);
    const emitter = new ParticleEmitter(pos, 0, 1, 0.1, amount / 0.1, PI, // pos, angle, emitSize, emitTime, emitRate, emiteCone
    0, // tileInfo
    color, color2, // colorStartA, colorStartB
    color, color2, // colorEndA, colorEndB
    0.3, size, size, 0.1, 0.05, // time, sizeStart, sizeEnd, speed, angleSpeed
    0.5, 0.95, 0.4, PI, 0, // damp, angleDamp, gravity, particleCone, fade
    0.5, 1 // randomness, collide, additive, colorLinear, renderOrder
    );
    emitter.elasticity = elasticity;
    emitter.particleDestroyCallback = persistentParticleDestroyCallback;
    return emitter;
}

class XP extends EngineObject {
    constructor(pos, xp) {
        super(pos, new Vector2(0.4, 0.4));
        this.timer = new Timer(0.1);
        this.following = false;
        // Set to gree if xp is less than 5, otherwise set to blue and gold for 10
        this.color =
            xp < 5
                ? rgb(0, 1, 0, 0.8)
                : xp < 10
                    ? rgb(0, 0, 1, 0.8)
                    : rgb(1, 1, 0, 0.8);
        this.renderOrder = 0;
        this.xp = xp;
    }
    update() {
        super.update();
        // find the distance to player
        const distance = this.pos.subtract(mainSystem.character.pos).length();
        if ((distance < 2.5 || this.following) && this.timer.elapsed()) {
            this.following = true;
            // move to player
            this.velocity = mainSystem.character.pos
                .subtract(this.pos)
                .normalize()
                .scale(0.2);
            this.timer.set(0.1);
        }
        if (distance < 1) {
            // destroy when close to player
            this.destroy();
            // add xp to player
            mainSystem.addXP(this.xp);
        }
    }
}

class SoundSystem {
    constructor() {
        this.sounds = {
            [0 /* Sounds.enemyDie */]: new Sound([
                ,
                ,
                136,
                0.22,
                ,
                0.08,
                1,
                2.5,
                1,
                ,
                66,
                0.03,
                0.05,
                ,
                ,
                ,
                ,
                0.93,
                ,
                ,
                -1068,
            ]),
            [1 /* Sounds.enemyHit */]: new Sound([
                ,
                0.1,
                368,
                0.02,
                0.04,
                0.04,
                2,
                4.3,
                -1,
                ,
                -344,
                0.01,
                ,
                ,
                282,
                ,
                ,
                0.53,
                0.02,
                ,
                130,
            ]),
            [2 /* Sounds.levelUp */]: new Sound([
                2,
                ,
                690,
                0.09,
                0.28,
                0.4,
                1,
                3.3,
                ,
                5,
                423,
                0.06,
                0.04,
                ,
                ,
                0.1,
                ,
                0.98,
                0.14,
                ,
                -1425,
            ]),
        };
        // @ts-ignore
        this.timers = {};
        // @ts-ignore
        this.timersDurations = {};
        Object.keys(this.sounds).forEach((key) => {
            // @ts-ignore
            const s = this.sounds[key];
            // default duration
            let duration = Array.isArray(s) ? s[1] : 0.1;
            // @ts-ignore
            this.timers[key] = new Timer(duration);
            // @ts-ignore
            this.timersDurations[key] = duration;
        });
    }
    play(sound) {
        if (this.timers[sound].elapsed()) {
            this.sounds[sound].play();
            this.timers[sound].set(this.timersDurations[sound]);
        }
    }
}
const soundSystem = new SoundSystem();

class Enemy extends GameObject {
    constructor(pos, level, isFlying) {
        super(1 /* GameObjectType.Enemy */, pos, vec2(1), tile(7, 8));
        this.spriteAtlas = [tile(7, 8), tile(8, 8)];
        this.flyingSpriteAtlas = [tile(9, 8), tile(10, 8)];
        this.isFlying = false;
        this.attackTimer = new Timer(1);
        this.dmg = 5;
        this.fallingTimer = new Timer();
        this.walkCyclePercent = 0;
        this.speed = 0.04;
        this.level = 1;
        this.isFlying = isFlying;
        // pink and green
        this.color = isFlying ? rgb(1, 0, 1) : rgb(0, 1, 0);
        this.level = level;
        switch (level) {
            case 1: {
                this.size = vec2(1, 1);
                this.dmg = isFlying ? 2 : 5;
                this.hp = isFlying ? 5 : 10;
                this.speed = isFlying ? 0.05 : 0.04;
                break;
            }
            case 2: {
                this.size = vec2(1.5, 1.5);
                this.dmg = isFlying ? 5 : 10;
                this.hp = isFlying ? 10 : 20;
                this.speed = isFlying ? 0.06 : 0.04;
                break;
            }
            case 3: {
                this.size = vec2(2, 2);
                this.dmg = isFlying ? 4 : 9;
                this.hp = isFlying ? 15 : 30;
                this.speed = isFlying ? 0.07 : 0.05;
                // orange
                this.color = rgb(1, 0.5, 0);
                break;
            }
            case 4: {
                this.size = vec2(2.5, 2.5);
                this.dmg = isFlying ? 7 : 15;
                this.hp = isFlying ? 20 : 40;
                this.speed = isFlying ? 0.08 : 0.06;
                // gray
                this.color = rgb(0.5, 0.5, 0.5);
                break;
            }
            case 5: {
                this.size = vec2(4, 4);
                this.isFlying = true;
                this.dmg = 30;
                this.hp = 500;
                this.speed = 0.11;
                // black
                this.color = rgb(0, 0, 0);
                break;
            }
        }
        this.setCollision(true, true, !this.isFlying);
        this.mass = 1;
        this.renderOrder = 1;
    }
    update() {
        super.update();
        if (mainSystem.character.isDead()) {
            return;
        }
        const moveDir = mainSystem.character.pos.subtract(this.pos).normalize();
        this.velocity = moveDir.scale(this.speed);
        const velocityLength = this.velocity.length();
        if (velocityLength > 0) {
            this.walkCyclePercent += velocityLength * 0.5;
            this.walkCyclePercent =
                velocityLength > 0.01 ? mod(this.walkCyclePercent) : 0;
        }
        if (this.velocity.x >= 0) {
            this.mirror = false;
        }
        else {
            this.mirror = true;
        }
        if (!this.isFlying) {
            if ((!mainSystem.map[Math.floor(this.pos.x)] ||
                mainSystem.map[Math.floor(this.pos.x)][Math.floor(this.pos.y)] ===
                    0) &&
                !this.fallingTimer.isSet()) {
                this.fallingTimer.set(1);
            }
            if (this.fallingTimer.active()) {
                this.size = vec2(1 - this.fallingTimer.getPercent());
            }
        }
        if (this.fallingTimer.elapsed()) {
            this.destroy();
        }
    }
    collideWithObject(object) {
        if (object.gameObjectType === 0 /* GameObjectType.Character */) {
            if (this.attackTimer.elapsed() && !mainSystem.character.isDead()) {
                this.attackTimer.set(1);
                const dodge = mainSystem.character.stats[6 /* UpgradeType.Dodge */];
                if (rand() <= dodge) {
                    new Marker(object.pos);
                    return false;
                }
                const armor = mainSystem.character.stats[5 /* UpgradeType.Armor */];
                object.damage(this.dmg - armor > 0 ? this.dmg - armor : 1);
            }
            return false;
        }
        return true;
    }
    kill() {
        if (this.destroyed)
            return;
        let xp = 1;
        if (this.level === 2) {
            xp = 3;
        }
        if (this.level === 3) {
            xp = 6;
        }
        if (this.level === 4) {
            xp = 10;
        }
        new XP(this.pos, xp);
        makeDebris(this.pos, this.color, 50, 0.1);
        soundSystem.play(0 /* Sounds.enemyDie */);
        this.destroy();
    }
    damage(damage) {
        const hp = super.damage(damage * mainSystem.character.stats[2 /* UpgradeType.Damage */]);
        if (!this.isDead()) {
            makeDebris(this.pos, this.color, 5, 0.1);
        }
        return hp;
    }
    render() {
        const animationFrame = Math.floor(this.walkCyclePercent * 2);
        if (this.isFlying) {
            this.tileInfo = this.flyingSpriteAtlas[animationFrame];
        }
        else {
            this.tileInfo = this.spriteAtlas[animationFrame];
        }
        super.render();
    }
}
class Marker extends GameObject {
    constructor(pos, text = "dodge") {
        super(5 /* GameObjectType.Effect */, pos, vec2(1), tile(0, 8));
        this.lifeTimer = new Timer(0.3);
        this.renderOrder = 2;
        this.velocity = vec2(rand(-0.1, 0.1), rand(-0.1, 0.1));
        this.text = text;
    }
    update() {
        super.update();
        if (this.lifeTimer.elapsed()) {
            this.destroy();
        }
    }
    render() {
        drawText(this.text, this.pos, rgb(1, 1, 1, this.lifeTimer.getPercent()), 0.2);
    }
}

const SPACE = "Space";
const PRESS_SPACE = ` (press ${SPACE})`;
const ArrowDown = "ArrowDown";
const ArrowUp = "ArrowUp";
const ArrowLeft = "ArrowLeft";
const ArrowRight = "ArrowRight";

const WEAPONS_POSITIONS = [
    vec2(-0.7, 0),
    vec2(0.7, 0),
    vec2(-0.7, 0.5),
    vec2(0.7, 0.5),
    vec2(0, 1),
    vec2(0, -0.5),
    vec2(0, 0), // center
];
class Character extends GameObject {
    constructor(pos) {
        super(0 /* GameObjectType.Character */, pos, vec2(1), tile(1, 8));
        this.spriteAtlas = [tile(0, 8), tile(1, 8), tile(2, 8)];
        this.walkCyclePercent = 0;
        this.spd = 0.1;
        this.hpRegenTimer = new Timer(3);
        this.d = 1;
        this.weapons = {};
        // stats
        this.mHp = 100;
        this.stats = {
            [0 /* UpgradeType.Health */]: 50,
            [1 /* UpgradeType.Speed */]: 1,
            [2 /* UpgradeType.Damage */]: 1,
            [5 /* UpgradeType.Armor */]: 0,
            [3 /* UpgradeType.AttackSpeed */]: 1,
            [6 /* UpgradeType.Dodge */]: 0,
            [4 /* UpgradeType.HpRegen */]: 0,
        };
        this.setCollision(true, false);
        this.size = vec2(1, 0.5);
        this.drawSize = vec2(2, 2);
        this.calcStats();
        // add weapons
        this.buildWeaponsSlots();
        mainSystem.m.forEach((m) => {
            if (m[0] === 0 /* MemoryType.Weapon */) {
                const w = WEAPONS[m[1]].w;
                const stats = WEAPONS[m[1]][m[2]];
                this.addWeapon(new w(stats));
            }
        });
    }
    calcStats() {
        [
            0 /* UpgradeType.Health */,
            1 /* UpgradeType.Speed */,
            2 /* UpgradeType.Damage */,
            5 /* UpgradeType.Armor */,
            3 /* UpgradeType.AttackSpeed */,
            6 /* UpgradeType.Dodge */,
            4 /* UpgradeType.HpRegen */,
        ].forEach((key) => {
            this.stats[key] = mainSystem.m.reduce((acc, m) => m[0] === 1 /* MemoryType.Upgrade */ && m[1] === key
                ? UPGRADES_WITH_PERCENT.includes(key)
                    ? acc + UPGRADES[m[1]].s / 100
                    : acc + UPGRADES[m[1]].s
                : acc, this.stats[key]);
        });
        this.mHp = this.stats[0 /* UpgradeType.Health */];
        this.hp = this.stats[0 /* UpgradeType.Health */];
    }
    buildWeaponsSlots() {
        for (let i = 0; i < WEAPONS_POSITIONS.length; i++) {
            this.weapons[WEAPONS_POSITIONS[i].toString()] = [];
        }
    }
    addWeapon(w) {
        if (w.type === 4 /* WeaponType.Field */ ||
            w.type === 5 /* WeaponType.CrossLaser */ ||
            w.type === 1 /* WeaponType.Spikes */) {
            const center = WEAPONS_POSITIONS[WEAPONS_POSITIONS.length - 1];
            this.weapons[center.toString()].push(w);
            this.addChild(w, center);
            return;
        }
        let added = false;
        let turns = 0;
        while (!added) {
            for (let i = 0; i < WEAPONS_POSITIONS.length; i++) {
                const pos = WEAPONS_POSITIONS[i];
                if (this.weapons[pos.toString()].length <= turns) {
                    this.weapons[pos.toString()].push(w);
                    this.addChild(w, pos);
                    added = true;
                    break;
                }
            }
            turns++;
        }
    }
    update() {
        // call parent and update physics
        super.update();
        // movement control
        let moveInput = isUsingGamepad
            ? gamepadStick(1)
            : vec2(
            // @ts-ignore
            keyIsDown(ArrowRight) - keyIsDown(ArrowLeft), 
            // @ts-ignore
            keyIsDown(ArrowUp) - keyIsDown(ArrowDown));
        if (mouseIsDown(0)) {
            moveInput = mousePos.subtract(this.pos);
        }
        if (moveInput.length() > 0) {
            moveInput = moveInput.normalize(1);
        }
        // apply movement acceleration and clamp
        const maxCharacterSpeed = 0.2 + (this.stats[1 /* UpgradeType.Speed */] - 1);
        // console.log(maxCharacterSpeed);
        this.velocity.x = clamp(moveInput.x * 0.42, -maxCharacterSpeed, maxCharacterSpeed);
        this.velocity.y = clamp(moveInput.y * 0.42, -maxCharacterSpeed, maxCharacterSpeed);
        this.spd = this.velocity.length();
        if (this.spd > 0) {
            this.walkCyclePercent += this.spd * 0.5;
            this.walkCyclePercent = this.spd > 0.01 ? mod(this.walkCyclePercent) : 0;
        }
        // mirror sprite if moving left
        if (moveInput.x) {
            this.d = moveInput.x > 0 ? 1 : -1;
        }
        // weapons
        this.updateWeapons();
        if (this.hpRegenTimer.elapsed()) {
            const newHealth = Math.min(this.mHp, this.hp + this.stats[4 /* UpgradeType.HpRegen */]);
            if (newHealth !== this.hp) {
                this.hp = newHealth;
                new Marker(this.pos, UPGRADES[4 /* UpgradeType.HpRegen */].i);
            }
            this.hpRegenTimer.set(3);
        }
    }
    updateWeapons() {
        mainSystem.enemies.forEach((e) => {
            Object.keys(this.weapons).forEach((vecKey) => {
                const ws = this.weapons[vecKey];
                ws.forEach((w) => {
                    if (w.target?.isDead()) {
                        w.target = undefined;
                    }
                    if (w.canFire(e.pos)) {
                        // if new target is closer
                        const newDistance = w.pos.distance(e.pos);
                        const oldDistance = w.target
                            ? w.pos.distance(w.target.pos)
                            : Infinity;
                        const canBeAttackedAsFlying = !w.donNotAttackFlying || !e.isFlying;
                        if ((!w.target || newDistance < oldDistance) &&
                            canBeAttackedAsFlying) {
                            w.target = e;
                        }
                    }
                });
            });
        });
        Object.keys(this.weapons).forEach((vecKey) => {
            const ws = this.weapons[vecKey];
            ws.forEach((w) => {
                if (w.target) {
                    w.aimAt(w.target.pos);
                    w.canFire(w.target.pos) && w.fire();
                }
            });
        });
    }
    render() {
        // animation
        if (this.spd > 0.02) {
            const animationFrame = Math.floor(this.walkCyclePercent * 2) + 1;
            this.tileInfo = this.spriteAtlas[animationFrame];
        }
        else {
            this.tileInfo = this.spriteAtlas[0];
        }
        drawTile(this.pos.subtract(vec2(0, -0.4)), this.drawSize || this.size, this.tileInfo, this.color, this.angle, this.d < 0, this.additiveColor);
        // super.render();
    }
}

// dungeon generation
const GRID_WIDTH = 150;
const GRID_HEIGHT = 150;
const MIN_ROOM_SIZE = 5;
const MAX_ROOM_SIZE = 25;
const MIN_CORRIDOR_LENGTH = 4;
const MAX_CORRIDOR_LENGTH = 10;
const DEFAULT_ROOMS = 20;
function createRoom() {
    const width = randInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
    const height = randInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
    const x = randInt(1, GRID_WIDTH - width - 1);
    const y = randInt(1, GRID_HEIGHT - height - 1);
    return { x, y, width, height };
}
function canPlaceRoom(grid, room) {
    for (let y = room.y - 1; y < room.y + room.height + 1; y++) {
        for (let x = room.x - 1; x < room.x + room.width + 1; x++) {
            if (grid[y][x] !== 0) {
                return false;
            }
        }
    }
    return true;
}
function placeRoom(grid, room) {
    for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
            grid[y][x] = 1; // Mark the room
        }
    }
}
function connectRooms(grid, room1, room2) {
    const startX = randInt(room1.x, room1.x + room1.width - 1);
    const startY = randInt(room1.y, room1.y + room1.height - 1);
    const endX = randInt(room2.x, room2.x + room2.width - 1);
    const endY = randInt(room2.y, room2.y + room2.height - 1);
    // Create a horizontal or vertical path with a corridor width of 3
    if (Math.random() < 0.5) {
        // Horizontal first, then vertical
        createHorizontalCorridor(grid, startX, endX, startY);
        createVerticalCorridor(grid, startY, endY, endX);
    }
    else {
        // Vertical first, then horizontal
        createVerticalCorridor(grid, startY, endY, startX);
        createHorizontalCorridor(grid, startX, endX, endY);
    }
}
function createHorizontalCorridor(grid, x1, x2, y) {
    const w = randInt(MIN_CORRIDOR_LENGTH, MAX_CORRIDOR_LENGTH);
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        for (let i = -1; i <= w - 1; i++) {
            if (grid[y + i] && grid[y + i][x] !== 1) {
                grid[y + i][x] = 2; // Mark the corridor
            }
        }
    }
}
function createVerticalCorridor(grid, y1, y2, x) {
    const w = randInt(MIN_CORRIDOR_LENGTH, MAX_CORRIDOR_LENGTH);
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        for (let i = -1; i <= w - 1; i++) {
            if (grid[y][x + i] !== 1) {
                grid[y][x + i] = 2; // Mark the corridor
            }
        }
    }
}
function generateDungeon(roomCount = DEFAULT_ROOMS) {
    const rooms = [];
    // Dungeon grid (0 = empty, 1 = room, 2 = corridor)
    let grid = Array.from({ length: GRID_HEIGHT + 1 }, () => Array(GRID_WIDTH + 1).fill(0));
    for (let i = 0; i < roomCount; i++) {
        let newRoom;
        do {
            newRoom = createRoom();
        } while (!canPlaceRoom(grid, newRoom));
        placeRoom(grid, newRoom);
        if (rooms.length > 0) {
            connectRooms(grid, rooms[rooms.length - 1], newRoom);
        }
        rooms.push(newRoom);
    }
    // debug
    // console.log(grid.map((row) => row.join("")).join("\n"));
    return [grid, rooms];
}
const directions = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
    [-1, -1],
    [1, 1],
    [-1, 1],
    [1, -1], // down-left
];
const hasNeighbor = (map, x, y) => directions.some(([dx, dy]) => {
    return map[x + dx] && map[x + dx][y + dy] > 0;
});
function generateLevelLayer(map, rooms, doCollisions = true) {
    const floorTile = new TileLayer(vec2(0), vec2(map.length, map[0].length), tile(12, 8));
    for (let x = 0; x < map.length; x++) {
        for (let y = 0; y < map[x].length; y++) {
            if (map[x][y] === 0 && doCollisions) {
                if (hasNeighbor(map, x, y)) {
                    setTileCollisionData(vec2(x, y), 1);
                    continue;
                }
            }
            if (map[x][y] > 0) {
                if (rooms.find((r) => r.x === y && r.y === x)) {
                    floorTile.setData(vec2(x, y), new TileLayerData(11));
                }
                else {
                    floorTile.setData(vec2(x, y), new TileLayerData(12));
                }
            }
        }
    }
    return floorTile;
}

class NextLevel extends EngineObject {
    constructor(tileLayer) {
        super();
        // character = new Character(vec2(0));
        this.tileLayer = tileLayer;
        this.renderOrder = -1e4;
        this.color = randColor(hsl(0, 0, 0.5), hsl(0, 0, 0.9));
        this.tileLayer.redraw();
        this.tileLayer.renderOrder = -1e4 - 1;
        this.tileLayer.scale = vec2(0.5);
    }
    render() {
        // create canvas and draw tile layer
        // draw black background
        mainContext.fillStyle = "black";
        mainContext.fillRect(0, 0, mainCanvasSize.x, mainCanvasSize.y);
        const scale = this.tileLayer.size;
        let parallax = vec2(1e3, -100).scale(1 ** 2);
        let cameraDeltaFromCenter = cameraPos
            .subtract(scale)
            .divide(scale.divide(parallax));
        const pos = mainCanvasSize
            .scale(0.1) // centerscreen
            .add(cameraDeltaFromCenter.scale(-0.4)); // apply parallax
        //   .add(vec2(-scale.x / 2, -scale.y / 2));
        // mainContext.fillStyle = "red";d
        // mainContext.fillRect(pos.x, pos.y, 300, 300);
        // mainContext.globalCompositeOperation = "lighter";
        mainContext.drawImage(this.tileLayer.canvas, pos.x, pos.y);
    }
}
class Sky extends EngineObject {
    constructor(speedMod = 1) {
        super();
        this.renderOrder = -1e4 + 1;
        this.skyColor = randColor(hsl(0, 0, 0.5, 0.1), hsl(0, 0, 0.1, 0.9));
        this.horizonColor = this.skyColor.subtract(hsl(0, 0, 0.05, 0)).mutate(0.3);
        this.seed = randInt(10);
        this.speedMod = speedMod;
    }
    render() {
        // fill background with a gradient
        const gradient = mainContext.createLinearGradient(0, 0, 0, mainCanvas.height);
        gradient.addColorStop(0, this.skyColor);
        gradient.addColorStop(1, this.horizonColor);
        mainContext.save();
        mainContext.fillStyle = gradient;
        mainContext.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
        const random = new RandomGenerator(this.seed);
        for (let i = 25; i--;) {
            const size = random.float(3, 5) ** 2;
            const speed = random.float() < 0.9
                ? random.float(5 * this.speedMod)
                : random.float(2 * this.speedMod, 7 * this.speedMod);
            const color = hsl(192, 0, 100, 0.8);
            const extraSpace = 50;
            const w = mainCanvas.width + 2 * extraSpace, h = mainCanvas.height + 2 * extraSpace;
            const scale = vec2(200);
            let parallax = vec2(1e3, -100).scale(1 ** 2);
            let cameraDeltaFromCenter = cameraPos
                .subtract(scale)
                .divide(scale.divide(parallax));
            const pos = mainCanvasSize
                .scale(0.1) // centerscreen
                .add(cameraDeltaFromCenter.scale(-0.4));
            const screenPos = vec2(((random.float(w) + time * speed) % w) - extraSpace, ((random.float(h) + time * speed * random.float()) % h) - extraSpace).add(pos);
            mainContext.shadowColor = "color";
            mainContext.shadowBlur = 3;
            mainContext.fillStyle = color;
            mainContext.fillRect(screenPos.x, screenPos.y, size, size);
        }
        mainContext.restore();
    }
}

class LevelExit extends GameObject {
    constructor(pos) {
        super(8 /* GameObjectType.LevelExit */, pos, vec2(2), tile(11, 8));
        this.animationTimer = new Timer(0.5);
        this.setCollision(true);
        this.mass = 0;
        new ParticleEmitter(this.pos, 0, //position, angle
        1, // emitSize
        0, // emitTime
        163, // emitRate
        3.12, // emitConeAngle
        undefined, // tileIndex
        new Color(0, 0.702, 1, 1), // colorStartA
        new Color(0.6, 0, 1, 1), // colorStartB
        new Color(0.459, 0.569, 1, 0), // colorEndA
        new Color(0.863, 0.659, 1, 0), // colorEndB
        0.4, // particleTime
        0.1, // sizeStart
        0.76, // sizeEnd
        0.15, // speed
        0.27, // angleSpeed
        0.11, // damping
        1, // angleDamping
        -0.7, // gravityScale
        3.14, // particleConeAngle
        0.1, // fadeRate
        0.1, // randomness
        0, // collideTiles
        0, // additive
        1 // randomColorLinear
        ); // particle emitter
    }
    render() {
        super.render();
        drawText("Level exit", this.pos.subtract(vec2(0, 1.5)), 0.8);
    }
    collideWithObject(object) {
        if (object?.gameObjectType === 0 /* GameObjectType.Character */) {
            mainSystem.startNextLevel();
        }
        return false;
    }
}

const LEVELS_XP = [
    0,
    10,
    25,
    50,
    75,
    100,
    150,
    200,
    300,
    415,
    550,
    700,
    900,
    1200,
    1500,
    2000,
    2500,
    3000,
    3500,
    4000,
    5000,
    6000,
    7500,
    9000,
    11000,
    13000,
    15000,
    Infinity,
];
class MainSystem {
    constructor() {
        this.spawnTimer = new Timer();
        this.chillTime = false;
        this.gameEnded = false;
        this.m = [];
        this.win = false;
    }
    init() {
        this.levels = [];
        setCameraScale(22);
        for (let i = 0; i < 6; i++) {
            const [map, rooms] = generateDungeon();
            this.levels.push({ map, rooms });
        }
        this.xp = 0;
        this.characterLevel = 0;
        this.enemyLevel = 1;
        this.deadEnemiesCount = 0;
        this.l = 1;
        this.enemies = [];
        this.m = [
            [
                0 /* MemoryType.Weapon */,
                [0 /* WeaponType.Gun */, 3 /* WeaponType.Sword */][Math.random() > 0.5 ? 0 : 1],
                1,
            ],
        ];
        this.startLevel();
        this.gameEnded = false;
    }
    startLevel() {
        initTileCollision(vec2(250, 250));
        const { map, rooms } = this.levels[this.l];
        this.map = map;
        this.rooms = rooms;
        const floorTile = generateLevelLayer(map, rooms, true);
        floorTile.redraw();
        this.floorTile = floorTile;
        this.setBackground();
        this.character = new Character(vec2(this.rooms[0].y + 1, this.rooms[0].x + 1));
        this.setLevelObjects();
        this.spawnTimer.set(this.getTimeForTimer());
    }
    rebuildCharacterAfterLevelUP() {
        const pos = this.character.pos.copy();
        this.character.destroy();
        this.character = new Character(pos);
    }
    startNextLevel() {
        this.clearLevel();
        this.l++;
        this.startLevel();
    }
    setLevelObjects() {
        if (this.levels[this.l + 1]) {
            const pos = vec2(this.rooms[this.rooms.length - 1].y + 1, this.rooms[this.rooms.length - 1].x + 1);
            this.levelExit = new LevelExit(pos);
        }
        else {
            const pos = vec2(this.rooms[this.rooms.length - 1].y + 1, this.rooms[this.rooms.length - 1].x + 1);
            this.superBoss = new Enemy(pos, 5, true);
            this.enemies.push(this.superBoss);
            this.levelExit = undefined;
        }
        for (let i = 1; i < this.rooms.length - 1; i++) {
            const pos = vec2(this.rooms[i].y + 1, this.rooms[i].x + 1);
            new XP(pos.subtract(vec2(0.5)), (this.l + 1) * 4);
        }
    }
    setBackground() {
        if (this.levels[this.l + 1]) {
            const { map, rooms } = this.levels[this.l + 1];
            const floorTile = generateLevelLayer(map, rooms, false);
            new NextLevel(floorTile);
        }
        new Sky();
    }
    enemyLevelUp() {
        if (this.enemyLevel >= 50)
            return;
        this.enemyLevel++;
    }
    //character
    getMaxMemory() {
        // console.log(this.memory);
        return this.m.reduce((acc, mt) => {
            if (mt[0] === 2 /* MemoryType.MemoryUpgrade */) {
                // console.log(mt);
                return acc + mt[1];
            }
            return acc;
        }, 13);
    }
    addXP(xp) {
        this.xp += xp;
        if (this.xp >= LEVELS_XP[this.characterLevel + 1]) {
            this.characterLevel++;
            soundSystem.play(2 /* Sounds.levelUp */);
            setPaused(true);
        }
    }
    isItFloor(pos) {
        return this.map[Math.floor(pos.x)]
            ? this.map[Math.floor(pos.x)][Math.floor(pos.y)] > 0
            : false;
    }
    clearLevel() {
        engineObjectsDestroy();
        this.enemies = [];
    }
    update() {
        if (this.character.isDead()) {
            this.clearLevel();
            this.gameEnded = true;
            return;
        }
        if (this.superBoss && this.superBoss.isDead()) {
            this.clearLevel();
            this.win = true;
            return;
        }
        // enemies
        const wasLive = this.enemies.length;
        this.enemies = this.enemies.filter((e) => !e.isDead());
        const isLive = this.enemies.length;
        this.setDeadEnemiesCount(wasLive - isLive);
        // spawn
        if (this.spawnTimer.elapsed()) {
            this.spawnTimer.set(this.getTimeForTimer());
            let maxEnemies = 30;
            if (this.l === 1) {
                maxEnemies = 60;
            }
            if (this.l === 2) {
                maxEnemies = 100;
            }
            if (this.l === 3) {
                maxEnemies = 300;
            }
            if (this.l === 4) {
                maxEnemies = 500;
            }
            if (this.l === 5) {
                maxEnemies = 100;
            }
            for (let i = 0; i < this.enemyLevel + Math.round(maxEnemies / 6); i++) {
                if (this.enemies.length > maxEnemies) {
                    this.chillTime = true;
                    return;
                }
                const enemyLevelLocal = randInt(0, Math.min(this.l + 1, 4));
                // higher chance for higher level enemies
                const isFlying = rand() <= 0.15;
                this.enemies.push(new Enemy(this.calcEnemyPosition(), enemyLevelLocal, isFlying));
            }
        }
    }
    getTimeForTimer() {
        if (this.chillTime) {
            this.chillTime = false;
            return 5;
        }
        return 3 + randInt(0, 2) + this.l;
    }
    setDeadEnemiesCount(plus) {
        if (plus + this.deadEnemiesCount > this.enemyLevel * 30) {
            this.enemyLevelUp();
        }
        this.deadEnemiesCount += plus;
    }
    calcEnemyPosition() {
        const radius = 24;
        while (true) {
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const pos = this.character.pos.add(vec2(x, y));
            if (this.isItFloor(pos))
                return pos;
        }
    }
    gameUpdatePost() {
        // set camera
        setCameraPos(cameraPos.lerp(this.character.pos, 0.3));
    }
    gameRenderPost() {
        // drawTextScreen(`Live enemies: ${this.enemies.length}`, vec2(95, 20), 16);
        // drawTextScreen(`Dead enemies: ${this.deadEnemiesCount}`, vec2(100, 40), 16);
        // drawTextScreen(`Enemy Level: ${this.enemyLevel}`, vec2(70, 60), 16);
        drawTextScreen(`💔: ${this.character.hp}/${this.character.mHp}`, vec2(70, 80), 16);
        drawTextScreen(`Data: ${this.xp}/${LEVELS_XP[this.characterLevel + 1]}`, vec2(70, 100), 16);
        // arrow to exit
        const currentTarget = this.levelExit || this.superBoss;
        if (currentTarget && currentTarget.pos.distance(this.character.pos) > 20) {
            const angle = currentTarget.pos.subtract(this.character.pos).angle();
            const dist = isTouchDevice ? 9 : 18;
            const posStart = this.character.pos.add(this.character.pos.copy().setAngle(angle, dist));
            const posEnd = this.character.pos.add(this.character.pos.copy().setAngle(angle, dist + 0.5));
            // console.log(posStart, posEnd, mainSystem.character.pos);
            // white
            drawLine(posStart, posEnd, 0.3, rgb(1, 1, 1, 0.9));
        }
    }
}
const mainSystem = new MainSystem();

class Weapon extends GameObject {
    constructor(pos, size, tileInfo) {
        super(7 /* GameObjectType.Weapon */, pos, size, tileInfo);
        this.fireTimer = new Timer();
        this.dist = 1000;
        this.minDistance = 0;
    }
    canFire(pos) {
        return (this.fireTimer.elapsed() &&
            this.pos.distance(pos) <= this.dist &&
            this.pos.distance(pos) >= this.minDistance);
    }
    fire() {
        this.fireTimer.set(this.fireRate / mainSystem.character.stats[3 /* UpgradeType.AttackSpeed */]);
    }
    aimAt(pos) {
        this.localAngle = pos.subtract(this.pos).angle();
        this.mirror = this.localAngle < 0;
    }
}

function getAABB(target, targetSize) {
    const halfSize = targetSize.scale(0.5);
    return [
        target.add(halfSize),
        target.subtract(halfSize),
        target.add(vec2(halfSize.x, -halfSize.y)),
        target.add(vec2(-halfSize.x, halfSize.y)),
    ];
}
function isAABBInRadius(pos, radius, target, targetSize) {
    if (pos.distance(target) <= radius) {
        return true;
    }
    const AABB = getAABB(target, targetSize);
    for (let i = 0; i < 4; i++) {
        if (pos.distance(AABB[i]) <= radius) {
            return true;
        }
    }
    return false;
}

class Sword extends Weapon {
    constructor(stats) {
        super(vec2(0), vec2(1), tile(3, 8));
        this.type = 3 /* WeaponType.Sword */;
        this.fireTimer.set(rand(-0.02, 0.02));
        const [, distance, dmg, fireRate, , , size] = stats;
        this.dist = distance;
        this.dmg = dmg;
        this.fireRate = fireRate;
        this.areaSize = size;
    }
    fire() {
        super.fire();
        this.area = new SwordDmgArea(this.pos, vec2(this.areaSize), this.target.pos, this.dmg);
    }
    render() {
        // hide sword if area is active
        this.color = rgb(1, 1, 1, this.area && this.area.liveTimer.active() ? 0 : 1);
        super.render();
    }
}
class SwordDmgArea extends GameObject {
    constructor(pos, size, target, dmg) {
        const newPos = target.lerp(pos, 0.5);
        super(6 /* GameObjectType.AreaDmg */, newPos, vec2(size));
        this.liveTimer = new Timer(0.15);
        this.dmg = dmg;
        this.target = target.copy();
        this.size = size;
        this.initialPos = pos.copy();
        mainSystem.enemies.forEach((enemy) => {
            if (isOverlapping(this.pos, this.size, enemy.pos, enemy.size)) {
                enemy.damage(this.dmg);
            }
        });
    }
    render() {
        const t = tile(3, 8);
        const globalPercent = this.liveTimer.getPercent();
        // debug
        // drawRect(this.pos, this.size, rgb(1, 0, 0, 0.5));
        const centerAngle = this.initialPos.subtract(this.pos).angle() + PI;
        const distance = this.initialPos.distance(this.pos);
        for (let i = 1; i < 5; i++) {
            const percent = i / 5;
            if (globalPercent < percent) {
                break;
            }
            const angel = lerpAngle(percent, centerAngle - PI / 4, centerAngle + PI / 4);
            const pos = this.initialPos.add(this.initialPos.copy().setAngle(angel, distance));
            drawTile(pos, this.size.scale(0.5), t, rgb(1, 1, 1, percent / 3), angel);
        }
    }
    update() {
        super.update();
        if (this.liveTimer.elapsed()) {
            this.destroy();
        }
    }
}
class Mortar extends Weapon {
    constructor(stats) {
        super(vec2(0), vec2(1), tile(5, 8));
        this.type = 2 /* WeaponType.Mortar */;
        this.minDistance = 2;
        this.donNotAttackFlying = true;
        this.fireTimer.set(rand(-0.02, 0.02));
        const [, distance, dmg, fireRate, lifeTime, dmgOverTime, size] = stats;
        this.dist = distance;
        this.fireRate = fireRate;
        this.dmg = dmg;
        this.fireTime = lifeTime;
        this.dmgOverTime = dmgOverTime;
        this.areaSize = size;
    }
    fire() {
        super.fire();
        new MortarShell(this, this.target.pos);
    }
}
class MortarShell extends GameObject {
    constructor(mortar, target) {
        super(5 /* GameObjectType.Effect */, mortar.pos, vec2(0.3, 0.5));
        // shell is moving in curve arc
        this.shellTimer = new Timer(0.7);
        this.maxY = 8;
        // red
        this.color = rgb(1, 0, 0);
        this.target = target.copy();
        this.start = mortar.pos.copy();
        this.dmg = mortar.dmg;
        this.fireTime = mortar.fireTime;
        this.dmgOverTime = mortar.dmgOverTime;
        this.areaSize = mortar.areaSize;
    }
    update() {
        const percent = this.shellTimer.getPercent();
        this.pos = this.start.lerp(this.target, percent);
        this.pos.y += Math.sin(percent * Math.PI) * this.maxY;
        new ParticleEmitter(this.pos, 0, // pos, angle
        0.1, 0.1, 10, PI, // emitSize, emitTime, emitRate, emiteCone
        // @ts-ignore
        0, // tileInfo
        //black
        rgb(0, 0, 0), rgb(0, 0, 0), 
        // colorStartA, colorStartB
        rgb(0.5, 0.5, 0.5, 0.8), rgb(0.5, 0.5, 0.5, 0.5), // colorEndA, colorEndB
        0.1, 0.1, 0.2, 0.05, 0.05, // time, sizeStart, sizeEnd, speed, angleSpeed
        0.9, 1, -0.3, PI, 0.1, // damp, angleDamp, gravity, particleCone, fade
        0.5, 0, 0, 0, 1e8 // randomness, collide, additive, colorLinear, renderOrder
        );
        super.update();
        if (this.shellTimer.elapsed()) {
            this.destroy();
            new AreaDmg(this.pos, vec2(this.areaSize), this.dmg, this.dmgOverTime, this.fireTime);
        }
    }
}
class AreaDmg extends GameObject {
    constructor(pos, size, dmg, dmgFire, lifeTime) {
        super(6 /* GameObjectType.AreaDmg */, pos, size);
        this.liveTimer = new Timer();
        this.dmgTimer = new Timer(0.1);
        this.dmgedFirst = false;
        this.color = rgb(1, 0, 0, 0.03);
        this.dmg = dmg;
        this.dmgFire = dmgFire;
        this.liveTimer.set(lifeTime);
    }
    update() {
        super.update();
        // particle fire 5 random particles
        for (let i = 0; i < 5; i++) {
            new ParticleEmitter(this.pos.add(randInCircle(this.size.x / 2)), 0, // pos, angle
            0.1, 0.1, 10, PI, // emitSize, emitTime, emitRate, emiteCone
            0, // tileInfo
            //red
            rgb(1, 0, 0), rgb(1, 0, 0), 
            // colorStartA, colorStartB
            rgb(1, 0.5, 0, 0.8), rgb(1, 0.5, 0, 0.5), // colorEndA, colorEndB
            0.1, 0.1, 0.2, 0.05, 0.05, // time, sizeStart, sizeEnd, speed, angleSpeed
            0.9, 1, -0.3, PI, 0.1, // damp, angleDamp, gravity, particleCone, fade
            0.5, 0, 0, 0, 1e8 // randomness, collide, additive, colorLinear, render
            );
        }
        if (!this.dmgedFirst) {
            this.dmgedFirst = true;
            // find all enemies in area
            mainSystem.enemies.forEach((enemy) => {
                if (isOverlapping(this.pos, this.size, enemy.pos, enemy.size)) {
                    enemy.damage(this.dmg);
                }
            });
        }
        if (this.dmgTimer.elapsed()) {
            // find all enemies in area
            mainSystem.enemies.forEach((enemy) => {
                if (!enemy.isFlying &&
                    isOverlapping(this.pos, this.size, enemy.pos, enemy.size)) {
                    enemy.damage(this.dmgFire);
                }
            });
            this.dmgTimer.set(0.1);
        }
        if (this.liveTimer.elapsed()) {
            this.destroy();
        }
    }
}
class ForceField extends Weapon {
    constructor(stats) {
        super(vec2(0, 0), vec2(1));
        this.type = 4 /* WeaponType.Field */;
        this.dmgTimer = new Timer(0.01);
        this.dmgEvery = 0.2;
        this.liveTimer = new Timer(0.01);
        this.fireTimer.set(rand(-0.02, 0.02));
        const [, distance, dmg, fireRate, liveTime, , size] = stats;
        this.dist = distance;
        this.dmg = dmg;
        this.fireRate = fireRate;
        this.liveTime = liveTime;
        //debug
        // this.color = rgb(0, 1, 1, 0.05);
        this.size = vec2(size);
    }
    fire() {
        super.fire();
        this.liveTimer.set(this.liveTime);
    }
    update() {
        super.update();
        if (this.liveTimer.active() && this.dmgTimer.elapsed()) {
            // find all enemies in area
            mainSystem.enemies.forEach((enemy) => {
                if (
                // don't know why but radius is smaller than visual radius
                isAABBInRadius(this.pos, this.size.x / 2 + 0.5, enemy.pos, enemy.size)) {
                    enemy.damage(this.dmg);
                }
            });
            this.dmgTimer.set(this.dmgEvery);
        }
    }
    render() {
        // super.render();
        if (this.liveTimer.active()) {
            const percent = this.liveTimer.getPercent();
            // draw a circle
            const pos = worldToScreen(this.pos);
            const size = this.size.x * 16;
            mainContext.beginPath();
            mainContext.arc(pos.x, pos.y, size, 0, 2 * Math.PI, false);
            // gradient from center to edge
            const gradient = mainContext.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size);
            gradient.addColorStop(0, "rgba(0, 255, 255, 0.4)");
            gradient.addColorStop(1 - percent, "rgba(0, 255, 255, 0.1)");
            gradient.addColorStop(1, "rgba(0, 255, 255, 0.05)");
            mainContext.fillStyle = gradient;
            mainContext.fill();
        }
    }
}
class Spikes extends Weapon {
    constructor(stats) {
        super(vec2(0, 0), vec2(1));
        this.type = 1 /* WeaponType.Spikes */;
        this.donNotAttackFlying = true;
        this.liveTimer = new Timer(0.01);
        this.liveTime = 0.2;
        this.step = 1;
        this.maxStep = 4;
        this.stepSize = 2.5;
        const [kb, distance, dmg, fireRate, , , size] = stats;
        this.dist = distance;
        this.dmg = dmg;
        this.fireRate = fireRate;
        this.stepSize = size;
        if (kb > 5) {
            this.maxStep = 5;
        }
        this.fireTimer.set(rand(-0.02, 0.02));
    }
    fire() {
        super.fire();
        this.liveTimer.set(this.liveTime);
        this.firePos = this.pos.copy();
        this.step = 1;
        this.createSpikes();
    }
    update() {
        super.update();
        if (this.liveTimer.elapsed() && this.firePos) {
            if (this.step < this.maxStep) {
                this.liveTimer.set(this.liveTime);
                this.createSpikes();
            }
        }
    }
    createSpikes() {
        const pos1 = this.firePos.add(vec2(this.stepSize * this.step, 0));
        const pos2 = this.firePos.add(vec2(-this.stepSize * this.step, 0));
        const pos1isFloor = mainSystem.isItFloor(pos1);
        const pos2isFloor = mainSystem.isItFloor(pos2);
        if (pos1isFloor) {
            new SpikesArea(pos1, vec2(this.stepSize), this.dmg);
        }
        if (pos2isFloor) {
            new SpikesArea(pos2, vec2(this.stepSize), this.dmg);
        }
        if (!pos1isFloor && !pos2isFloor) {
            //skip to next pne
            this.liveTimer.set(0.01);
        }
        this.step++;
    }
    render() { }
}
class SpikesArea extends EngineObject {
    constructor(pos, size, dmg) {
        super(pos, size, tile(6, 8), undefined, rgb(1, 0, 0, 0.5), 0);
        this.liveTimer = new Timer(0.8);
        this.dmgedFirst = false;
        this.dmg = dmg;
    }
    update() {
        const percent = this.liveTimer.getPercent();
        super.update();
        if (this.liveTimer.elapsed()) {
            this.destroy();
        }
        if (!this.dmgedFirst && percent > 0.3) {
            this.dmgedFirst = true;
            // find all enemies in area
            mainSystem.enemies.forEach((enemy) => {
                if (!enemy.isFlying &&
                    isOverlapping(this.pos, this.size, enemy.pos, enemy.size)) {
                    enemy.damage(this.dmg);
                    enemy.applyForce(vec2(0, this.dmg / 20));
                }
            });
        }
        if (percent < 0.5) {
            this.color = rgb(1, 1, 1, percent);
        }
        else {
            this.color = rgb(1, 1, 1, 1 - percent);
        }
    }
}

class CrossLaser extends Weapon {
    constructor(stats) {
        super(vec2(0), vec2(1));
        this.type = 5 /* WeaponType.CrossLaser */;
        this.dmgTimer = new Timer(0.01);
        this.dmgEvery = 0.05;
        this.liveTimer = new Timer(0.01);
        this.lineSize = 0.5;
        this.fireTimer.set(rand(-0.02, 0.02));
        const [, distance, dmg, fireRate, liveTime, , size] = stats;
        this.dist = distance;
        this.dmg = dmg;
        this.fireRate = fireRate;
        this.liveTime = liveTime;
        this.lineSize = size;
    }
    fire() {
        super.fire();
        this.liveTimer.set(this.liveTime);
    }
    update() {
        super.update();
        if (this.liveTimer.active() && this.dmgTimer.elapsed()) {
            //dmg ever
            mainSystem.enemies.forEach((enemy) => {
                if (
                // don't know why but radius is smaller than visual radius
                isOverlapping(this.pos, vec2(this.dist * 2, this.lineSize), enemy.pos, enemy.size) ||
                    isOverlapping(this.pos, vec2(this.lineSize, this.dist * 2), enemy.pos, enemy.size)) {
                    enemy.damage(this.dmg);
                }
            });
            this.dmgTimer.set(this.dmgEvery);
        }
    }
    render() {
        if (this.liveTimer.active()) {
            //draw two rectangles from center
            // as a cross
            //   const pos = worldToScreen(this.pos);
            //   const size = this.distance * 2 * 16;
            //   const size2 = this.lineSize * 16;
            //   const canvasPosHorizontal = vec2(pos.x - size / 2, pos.y - size2 / 2);
            //   const canvasPosVertical = vec2(pos.x - size2 / 2, pos.y - size / 2);
            // horizontal
            //   mainContext.fillRect(
            //     canvasPosHorizontal.x,
            //     canvasPosHorizontal.y,
            //     size,
            //     size2
            //   );
            //   const gradient = mainContext.createLinearGradient(
            //     canvasPosVertical.x,
            //     canvasPosVertical.y,
            //     canvasPosVertical.x,
            //     canvasPosVertical.y + size2
            //   );
            //   gradient.addColorStop(0, "rgba(255, 0, 0, 0.4)");
            //   gradient.addColorStop(0.5, "rgba(255, 0, 0, 0.1)");
            //   gradient.addColorStop(1, "rgba(255, 0, 0, 0.4)");
            //   mainContext.fillStyle = gradient;
            //   mainContext.fill();
            //   // vertical
            //   mainContext.fillRect(
            //     canvasPosVertical.x,
            //     canvasPosVertical.y,
            //     size2,
            //     size
            //   );
            //   const gradient2 = mainContext.createLinearGradient(
            //     canvasPosVertical.x,
            //     canvasPosVertical.y,
            //     canvasPosVertical.x + size2,
            //     canvasPosVertical.y
            //   );
            //   gradient2.addColorStop(0, "rgba(255, 0, 0, 0.4)");
            //   gradient2.addColorStop(0.5, "rgba(255, 0, 0, 0.1)");
            //   gradient2.addColorStop(1, "rgba(255, 0, 0, 0.4)");
            //   mainContext.fillStyle = gradient2;
            //   mainContext.fill();
            drawRect(this.pos, vec2(this.dist * 2, this.lineSize), rgb(1, 0, 0, 0.3));
            drawRect(this.pos, vec2(this.lineSize, this.dist * 2), rgb(1, 0, 0, 0.3));
        }
    }
}

class Bullet extends GameObject {
    constructor(pos, angle, dmg) {
        super(4 /* GameObjectType.Bullet */, pos, vec2(0.2, 0.2));
        this.speed = 0.5;
        this.lifeTime = 1.5;
        this.lifeTimer = new Timer(this.lifeTime);
        this.angle = angle;
        // organge
        this.color = rgb(1, 0.5, 0);
        this.initialPos = pos;
        this.setCollision(true, false, false);
        this.velocity = vec2(0, this.speed).rotate(-angle);
        this.dmg = dmg;
    }
    update() {
        super.update();
        this.color.a = 1 - this.lifeTimer.getPercent();
        if (this.lifeTimer.elapsed())
            this.destroy();
    }
    collideWithObject(object) {
        if (object.gameObjectType === 1 /* GameObjectType.Enemy */) {
            this.destroy();
            object.damage(this.dmg);
            object.applyForce(this.velocity.scale(0.5));
            return false;
        }
        return false;
    }
    render() {
        drawRect(this.pos, this.size.scale(1.3), rgb(255, 0, 0, this.color.a - 0.5), this.angle);
        super.render();
    }
}
class Gun extends Weapon {
    constructor(stats) {
        super(vec2(0, 0), vec2(1), tile(4, 8));
        this.type = 0 /* WeaponType.Gun */;
        const [, distance, dmg, fireRate] = stats;
        this.dist = distance;
        this.dmg = dmg;
        this.fireRate = fireRate;
        this.fireTimer.set(rand(-0.02, 0.02));
    }
    fire() {
        super.fire();
        new Bullet(this.pos, this.angle, this.dmg);
    }
}

const AUTO_AIM = "auto aim";
const ONLY_GROUND = "only ground enemies";
const WEAPONS = {
    [0 /* WeaponType.Gun */]: {
        w: Gun,
        i: "🔫",
        // green
        c: rgb(0, 1, 0),
        d: ["MachineGun.js", AUTO_AIM, "knockback"],
        1: [2, 15, 1.3, 0.15, , , ,],
        2: [3, 16, 2, 0.12, , , ,],
        3: [5, 17, 3.8, 0.1, , , ,],
    },
    [1 /* WeaponType.Spikes */]: {
        w: Spikes,
        i: "📌",
        // blue dark
        c: rgb(0, 0, 1),
        d: ["Spikes.js", "area dmg", "only horizontal", ONLY_GROUND],
        // [KB, distance, damage, speed, lifeTime, dmgOverTime, size];
        1: [3, 15, 10, 4, , , 2.5],
        2: [5, 15, 18, 3.5, , , 3.5],
        3: [8, 15, 24, 3, , , 4.5],
    },
    [2 /* WeaponType.Mortar */]: {
        w: Mortar,
        i: "💣",
        // red
        c: rgb(1, 0, 0),
        d: ["Mortar.js", AUTO_AIM, "area dmg", "fire dmg over time", ONLY_GROUND],
        //[KB, distance, damage, speed, lifeTime, dmgOverTime, size];
        1: [3, 15, 7, 2.5, 1, 1, 4.5],
        2: [5, 16, 10, 2, 1.5, 1.1, 5.5],
        3: [8, 18, 15, 1.8, 2, 1.2, 6.5],
    },
    [4 /* WeaponType.Field */]: {
        w: ForceField,
        i: "🌀",
        // purple
        c: rgb(0.5, 0, 0.5),
        d: ["ForceField.js", "area dmg around you"],
        // [KB, distance, damage, speed, lifeTime, dmgOverTime, size];
        1: [3, 4, 2, 5, 2, , 4],
        2: [5, 4, 2.5, 4.5, 3, , 4.5],
        3: [6, 4, 3, 3, 3.5, , 5],
    },
    [3 /* WeaponType.Sword */]: {
        w: Sword,
        i: "🔪",
        // grey
        c: rgb(0.5, 0.5, 0.5),
        d: ["Katana.js", AUTO_AIM, "area dmg"],
        // [KB, distance, damage, speed, lifeTime, dmgOverTime, size];
        1: [2, 3.3, 10, 1, , , 3.5],
        2: [3, 4.5, 18, 0.8, , , 4.8],
        3: [5, 6, 25, 0.5, , , 6],
    },
    [5 /* WeaponType.CrossLaser */]: {
        w: CrossLaser,
        i: "❌",
        // yellow
        c: rgb(1, 1, 0),
        d: ["CrossLaser.js", "horizontal", "vertical"],
        1: [2, 30, 0.3, 3.2, 2, , 0.5],
        2: [3, 30, 0.6, 2.6, 2, , 1],
        3: [4, 30, 1, 2.3, 2, , 2],
    },
};
const UPGRADES_WITH_PERCENT = [
    2 /* UpgradeType.Damage */,
    1 /* UpgradeType.Speed */,
    6 /* UpgradeType.Dodge */,
    3 /* UpgradeType.AttackSpeed */,
];
const UPGRADES = {
    [2 /* UpgradeType.Damage */]: {
        i: "💥",
        s: 3,
    },
    [1 /* UpgradeType.Speed */]: {
        i: "🏃",
        s: 4,
    },
    [0 /* UpgradeType.Health */]: {
        i: `💔`,
        s: 5,
    },
    [6 /* UpgradeType.Dodge */]: {
        i: "🤺",
        s: 3,
    },
    [3 /* UpgradeType.AttackSpeed */]: {
        i: "🕒",
        s: 5,
    },
    [5 /* UpgradeType.Armor */]: {
        i: "🛡️",
        s: 3,
    },
    [4 /* UpgradeType.HpRegen */]: {
        i: "❤️‍🩹",
        s: 2,
    },
};

const MEMORY_UPGRADES = [
    2 /* MemoryUpgrade.Uglify */,
    3 /* MemoryUpgrade.Gzip */,
    4 /* MemoryUpgrade.ClosureCompiler */,
    5 /* MemoryUpgrade.Roadroller */,
    6 /* MemoryUpgrade.XemGolfing */,
];
const AUTOUPGADEBLE_WEAPONS = [
    1 /* WeaponType.Spikes */,
    4 /* WeaponType.Field */,
    5 /* WeaponType.CrossLaser */,
];

const calcCurrentKb = () => {
    let currentKb = 0;
    mainSystem.m.forEach((m) => {
        if (m[0] === 0 /* MemoryType.Weapon */) {
            currentKb += WEAPONS[m[1]][m[2]][0];
        }
        if (m[0] === 1 /* MemoryType.Upgrade */) {
            currentKb += 1;
        }
    });
    return currentKb;
};
const findNextMemoryUpgrade = () => {
    let maxUpgrade = 0;
    mainSystem.m.forEach((m) => {
        if (m[0] === 2 /* MemoryType.MemoryUpgrade */) {
            maxUpgrade = Math.max(maxUpgrade, m[1]);
        }
    });
    for (let i = 0; i < MEMORY_UPGRADES.length; i++) {
        if (MEMORY_UPGRADES[i] > maxUpgrade) {
            return MEMORY_UPGRADES[i];
        }
    }
    return 0;
};
const chooseRandomItem = (position) => {
    const lastKb = mainSystem.getMaxMemory() - calcCurrentKb();
    let toChoose;
    if (mainSystem.m.length > 0) {
        // for the first position if there is a memory for last weapon upgrade
        const lastItem = mainSystem.m[mainSystem.m.length - 1];
        const lastWeapon = lastItem[0] === 0 /* MemoryType.Weapon */ && lastItem[2] < 3 ? lastItem : null;
        // do we have enough memory for the last weapon upgrade
        if (rand() < 0.5 &&
            position === 0 &&
            lastWeapon &&
            // @ts-ignore
            lastKb >= WEAPONS[lastWeapon[1]][lastWeapon[2] + 1][0]) {
            return [0 /* MemoryType.Weapon */, lastWeapon[1], lastWeapon[2] + 1];
        }
        if ((lastKb === 0 || (lastKb <= 3 && rand() < 0.5)) &&
            findNextMemoryUpgrade() > 0) {
            return [2 /* MemoryType.MemoryUpgrade */, findNextMemoryUpgrade()];
        }
    }
    const acc = [];
    const weaponsAcc = [];
    const upgradesAcc = [];
    Object.keys(WEAPONS).forEach((key) => {
        const weapon = WEAPONS[key];
        if (lastKb >= weapon[1][0]) {
            acc.push([0 /* MemoryType.Weapon */, Number(key), 1]);
        }
    });
    Object.keys(UPGRADES).forEach((key) => {
        UPGRADES[key];
        if (lastKb >= 1) {
            acc.push([1 /* MemoryType.Upgrade */, Number(key)]);
        }
    });
    if (position === 0 && weaponsAcc.length > 0 && rand() < 0.8) {
        toChoose = weaponsAcc[randInt(0, weaponsAcc.length - 1)];
        const alreadyExist = mainSystem.m.find((mt) => mt[0] === toChoose[0] && mt[1] === toChoose[1]);
        if (!alreadyExist || !AUTOUPGADEBLE_WEAPONS.includes(toChoose[1])) {
            return toChoose;
        }
        if (alreadyExist[2] < 3 &&
            lastKb >= WEAPONS[toChoose[1]][alreadyExist[2] + 1][0]) {
            return [0 /* MemoryType.Weapon */, toChoose[1], alreadyExist[2] + 1];
        }
    }
    acc.push(...weaponsAcc, ...upgradesAcc);
    if (acc.length === 0) {
        return [3 /* MemoryType.XPUpgade */, 500];
    }
    let t = 0;
    while (t < 10) {
        const item = acc[randInt(0, acc.length - 1)];
        if (item[0] === 0 /* MemoryType.Weapon */) {
            toChoose = item;
            const alreadyExist = mainSystem.m.find((mt) => mt[0] === toChoose[0] && mt[1] === toChoose[1]);
            if (!alreadyExist || !AUTOUPGADEBLE_WEAPONS.includes(toChoose[1])) {
                return toChoose;
            }
            if (alreadyExist[2] < 3 &&
                lastKb >= WEAPONS[toChoose[1]][alreadyExist[2] + 1][0]) {
                return [0 /* MemoryType.Weapon */, toChoose[1], alreadyExist[2] + 1];
            }
        }
        else {
            return item;
        }
        t++;
    }
    // find appropriate memory items
};

class ConfirmButton extends EngineObject {
    constructor(pos) {
        super(pos, vec2(8, 2), undefined, undefined, hsl(0, 0, 1), 101);
        this.selected = false;
        // white
    }
    render() {
        drawRect(this.pos, this.size, 
        // white
        rgb(1, 1, 1));
        drawText(`Confirm${isTouchDevice ? "" : PRESS_SPACE}`, this.pos.add(vec2(0, 0)), 0.6, hsl(0, 0, 0));
    }
}
class Button extends EngineObject {
    constructor(pos, icon, text, kb, level) {
        super(pos, vec2(8, 5), undefined, undefined, hsl(0, 0, 1), 101);
        this.selected = false;
        // white
        this.text = text;
        this.icon = icon;
        this.l = level;
        this.kb = kb;
    }
    render() {
        if (this.selected) {
            drawRect(this.pos.add(vec2(-0.3, -0.3)), this.size, 
            //green
            rgb(0, 1, 0, 0.5));
        }
        drawRect(this.pos, this.size, 
        // white
        rgb(1, 1, 1));
        drawText(this.icon, this.pos.add(vec2(0, 1.5)), 0.8, hsl(0, 0, 0));
        for (let i = 0; i < this.text.length; i++) {
            let text = "* " + this.text[i];
            if (i === 0) {
                text = this.l ? `${this.l}  lvl ${this.text[i]}` : this.text[i];
                drawText(text, this.pos.add(vec2(0, 0.6 + i * -0.6)), 0.6, hsl(0, 0, 0));
            }
            else {
                // dark grey
                drawText(text, this.pos.add(vec2(0, 0.6 + i * -0.6)), 0.6, hsl(0, 0, 0.3));
            }
        }
        if (this.kb) {
            drawText(`(+${this.kb}kb)`, this.pos.add(vec2(1.5, 1.5)), 0.5, hsl(0, 0, 0));
        }
    }
}
class CharacterMenu extends EngineObject {
    constructor(gameOver = false, win = false) {
        const pos = screenToWorld(vec2(mainCanvas.width / 2, mainCanvas.height / 2));
        super(pos, vec2(29, 27), undefined, undefined, hsl(0, 0, 0, 0.8), 100);
        this.selected = 0;
        this.buttons = [];
        this.items = [];
        this.state = 0;
        if (gameOver) {
            this.state = -1;
        }
        if (win) {
            this.state = 1;
        }
        this.items = [
            chooseRandomItem(0),
            chooseRandomItem(1),
            chooseRandomItem(2),
        ];
        if (this.state === 0) {
            this.addButton(0, this.items[0]);
            this.addButton(1, this.items[1]);
            this.addButton(2, this.items[2]);
        }
        this.confirmButton = new ConfirmButton(pos.add(vec2(0, 6)));
        this.addChild(this.confirmButton);
        const c = new CharacterStats(pos.subtract(this.size.scale(0.5).add(vec2(-0.5, -11.5))));
        this.addChild(c);
        const m = new CharacterMemory(pos.subtract(this.size.scale(0.5).add(vec2(-13, -11.5))));
        this.addChild(m);
    }
    addButton(place, mt) {
        // console.log(mt);
        // if 0 then -10, if 1 then 0, if 2 then 10
        const x = place * 10 - 10;
        const buttonPos = this.pos.add(vec2(x, 2));
        let i = "";
        let d = [];
        let l;
        let kb;
        if (mt[0] === 0 /* MemoryType.Weapon */) {
            i = WEAPONS[mt[1]].i;
            d = WEAPONS[mt[1]].d;
            l = mt[2];
            kb = WEAPONS[mt[1]][mt[2]][0];
            if (l > 1) {
                kb = WEAPONS[mt[1]][l][0] - WEAPONS[mt[1]][l - 1][0];
            }
        }
        if (mt[0] === 1 /* MemoryType.Upgrade */) {
            i = UPGRADES[mt[1]].i;
            const text = "+" + UPGRADES[mt[1]].s.toString();
            const suffix = UPGRADES_WITH_PERCENT.includes(mt[1]) ? "%" : "";
            kb = 1;
            d = [text + suffix];
        }
        if (mt[0] === 2 /* MemoryType.MemoryUpgrade */) {
            i = "💾";
            d = [`+${mt[1]}kb`];
        }
        if (mt[0] === 3 /* MemoryType.XPUpgade */) {
            i = "🌟";
            d = [`+${mt[1]}xp`];
        }
        // @ts-ignore
        const b = new Button(buttonPos, i, d, kb, l);
        this.buttons.push(b);
        this.addChild(b);
        if (place === 0) {
            b.selected = true;
        }
    }
    select(n) {
        this.selected += n;
        if (this.selected >= this.buttons.length) {
            this.selected = 0;
        }
        else if (this.selected < 0) {
            this.selected = this.buttons.length - 1;
        }
        this.buttons.forEach((b, i) => (b.selected = i === this.selected));
    }
    mouseSelect() {
        this.buttons.forEach((b, i) => {
            if (isOverlapping(b.pos, b.size, mousePos)) {
                this.selected = i;
                this.buttons.forEach((_b) => (_b.selected = false));
                b.selected = true;
            }
        });
        if ((isOverlapping(this.confirmButton.pos, this.confirmButton.size, mousePos) &&
            mouseWasReleased(0)) ||
            keyWasReleased(SPACE)) {
            if (this.state !== 0) {
                //refresh page
                window.location.reload();
            }
            setPaused(false);
            this.addItem(this.items[this.selected]);
            mainSystem.rebuildCharacterAfterLevelUP();
        }
    }
    addItem(selected) {
        if (selected[0] === 0 /* MemoryType.Weapon */ && selected[2] > 1) {
            // replace last item with the new one
            mainSystem.m = mainSystem.m.map((m) => {
                if (m[0] === 0 /* MemoryType.Weapon */ && m[1] === selected[1]) {
                    return selected;
                }
                return m;
            });
            return;
        }
        if (selected[0] === 3 /* MemoryType.XPUpgade */) {
            mainSystem.addXP(selected[1]);
            return;
        }
        mainSystem.m.push(selected);
    }
    render() {
        super.render();
        let text = "Level UP";
        if (this.state === -1) {
            text = "Game over";
        }
        if (this.state === 1) {
            text = "You win";
        }
        drawText(text, this.pos.add(vec2(-10, 6)), 0.9, hsl(0, 0, 1));
        if (this.state === 0) {
            drawText("Select", this.pos.add(vec2(10, 6)), 0.9, hsl(0, 0, 1));
        }
    }
    gameUpdatePost() {
        keyWasReleased(ArrowRight) && this.select(1);
        keyWasReleased(ArrowLeft) && this.select(-1);
        this.mouseSelect();
    }
}
class CharacterStats extends EngineObject {
    constructor(pos) {
        super(pos, vec2(40), undefined, undefined, hsl(0, 0, 0, 0.8), 101);
        // console.log(mainSystem.character.stats);
    }
    render() {
        drawText("Stats:", this.pos.add(vec2(1.5, 0)), 1, hsl(0, 0, 1));
        Object.entries(mainSystem.character.stats).forEach(([key, value], i) => {
            let text = `${UPGRADES[key].i}: ${value}`;
            if (UPGRADES_WITH_PERCENT.includes(Number(key))) {
                value = value * 100;
                value = Math.round(value);
                text = `${UPGRADES[key].i}: ${value}%`;
            }
            if (Number(key) === 0 /* UpgradeType.Health */) {
                text = text + "hp";
            }
            if (Number(key) === 4 /* UpgradeType.HpRegen */) {
                text = text + "hp / 3sec";
            }
            if (Number(key) === 5 /* UpgradeType.Armor */) {
                text = `${UPGRADES[key].i}: -${value} dmg`;
            }
            drawText(text, this.pos.add(vec2(0, -i - 1)), 1, hsl(0, 0, 1), 0.2, hsl(0, 0, 100), "left");
        });
    }
}
class CharacterMemory extends EngineObject {
    constructor(pos) {
        super(pos, vec2(40), undefined, undefined, hsl(0, 0, 0, 0.8), 101);
        this.maxMemory = mainSystem.getMaxMemory();
        this.currentMemory = calcCurrentKb();
    }
    render() {
        drawText(`MEM ${this.currentMemory}kb / ${this.maxMemory}kb`, this.pos.add(vec2(0.5, 0)), 1, hsl(0, 0, 1), 0.2, hsl(0, 0, 100), "left");
        const kbInLine = 10;
        // drawRect(this.pos, this.size, this.color);
        let p = 0;
        let y = 0;
        mainSystem.m.forEach((m) => {
            const [upgradeType, _type, level] = m;
            if (upgradeType !== 0 /* MemoryType.Weapon */ &&
                upgradeType !== 1 /* MemoryType.Upgrade */)
                return;
            let kb = 1;
            if (upgradeType === 0 /* MemoryType.Weapon */) {
                const [_kb] = WEAPONS[_type][level];
                kb = _kb;
            }
            for (let j = 1; j <= kb; j++) {
                if (p % kbInLine === 0) {
                    y--;
                    p = 0;
                }
                p++;
                drawRect(this.pos.add(vec2(p, 0 + y)), vec2(1), WEAPONS[_type].c);
            }
            const iconPos = this.pos.add(vec2(p, y - 0.1));
            if (upgradeType === 1 /* MemoryType.Upgrade */) {
                drawText(UPGRADES[_type].i, iconPos, 0.5);
            }
            else {
                drawText(WEAPONS[_type].i, iconPos, 0.5);
            }
        });
        for (let j = 1; j <= this.maxMemory - this.currentMemory; j++) {
            if (p % kbInLine === 0) {
                y--;
                p = 0;
            }
            p++;
            drawRect(this.pos.add(vec2(p, 0 + y)), vec2(1), hsl(0, 0, 0.5));
            drawRect(this.pos.add(vec2(p, 0 + y)), vec2(0.9), hsl(0, 0, 1));
        }
    }
}

class MainMenu extends EngineObject {
    constructor() {
        const pos = screenToWorld(vec2(mainCanvas.width / 2, mainCanvas.height / 2));
        super(pos, vec2(8, 3));
        this.showMenu = true;
        // white
        this.color = hsl(0, 0, 1);
        new Sky(5);
    }
    render() {
        if (!this.showMenu)
            return;
        drawRect(this.pos.add(vec2(0, -0.5)), this.size, 
        // white
        hsl(0, 0, 1));
        drawText(`Data warrior`, this.pos.add(vec2(0, 4)), 1.5, 
        // white
        hsl(0, 0, 1), 0.2, 
        // black
        hsl(0, 0, 0));
        drawText(`13kb limit`, this.pos.add(vec2(0, 2.5)), 1, 
        // red
        hsl(0, 1, 0.5), 0.2, 
        // black
        hsl(0, 0, 0));
        drawText(`Start${isTouchDevice ? "" : PRESS_SPACE}`, this.pos.add(vec2(0, -0.5)), 0.6, 
        // black
        hsl(0, 0, 0));
    }
    update() {
        if (this.showMenu && keyWasPressed(SPACE)) {
            this.startGame();
        }
        if (mouseWasReleased(0) && isOverlapping(this.pos, this.size, mousePos)) {
            this.startGame();
        }
    }
    startGame() {
        this.showMenu = false;
        this.destroy();
        mainSystem.init();
    }
}

let characterMenu;
let mainMenu;
///////////////////////////////////////////////////////////////////////////////
function gameInit() {
    setTileSizeDefault(vec2(8));
    setTileFixBleedScale(0.05);
    setFontDefault("monospace");
    playAudioFile("./DataWarrior13.mp3", 0.4, true);
    // called once after the engine starts up
    // setup the game
    mainMenu = new MainMenu();
    // mainMenu.startGame();
}
///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
    // called every frame at 60 frames per second
    // handle input and update the game state
    if (mainMenu?.showMenu) {
        return;
    }
    mainSystem.update();
}
///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
    // called after physics and objects are updated
    // setup camera and prepare for render
    if (mainMenu?.showMenu) {
        return;
    }
    if (mainSystem.win && !characterMenu) {
        setPaused(true);
        characterMenu = new CharacterMenu(false, true);
    }
    if (mainSystem.gameEnded && !characterMenu) {
        setPaused(true);
        characterMenu = new CharacterMenu(true);
    }
    mainSystem.gameUpdatePost();
    // TODO remove , debug
    // if (keyWasReleased("Enter") && !paused) {
    //   setPaused(!paused);
    // }
    if (paused && !characterMenu) {
        characterMenu = new CharacterMenu();
    }
    if (!paused && characterMenu) {
        characterMenu.destroy();
        characterMenu = undefined;
    }
    if (paused && characterMenu) {
        characterMenu.gameUpdatePost();
    }
}
///////////////////////////////////////////////////////////////////////////////
function gameRender() {
    // called before objects are rendered
    // draw any background effects that appear behind objects
}
///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
    // called after objects are rendered
    // draw effects or hud that appear above all objects
    // todo hud
    if (mainMenu?.showMenu) {
        return;
    }
    mainSystem.gameRenderPost();
}
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, [
    "./1.png",
]);
