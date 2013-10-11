define(['jquery', 'underscore', 'backbone'],
function   ($, _, Backbone) {

    //
    //  Modules
    //
    
    Module = Backbone.Model.extend({
        initialize:function(){
            //console.log("module init");
        },
        defaults:{
            name:"Default module"
        },
        getPercents: function(){
            var rank = this.get('currentRank');
            var calculated_types = this.get('types');
            var temp_calc = {};
            for(var key in calculated_types){
                temp_calc[key] = calculated_types[key] * rank;
                //console.log(key + ": " + temp_calc[key] + ", rank:" + rank);
            }
            return temp_calc;
        },
        increaseModlevel: function(){
            if ((this.get("currentRank") + 1) <= this.get("maxRanks")){
                this.set("currentRank", this.get("currentRank") + 1);
            }
        },
        decreaseModlevel: function(){
            if ((this.get("currentRank") - 1) >= 0){
                this.set("currentRank", this.get("currentRank") - 1);
            }
        }
    });

    ModuleCollection = Backbone.Collection.extend({
       model: Module
    });

    //
    //  Rifle Mods
    //

    
    
    Bane = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Bane", 
            types:{'Damage':5}, 
            maxRanks:6,
            currentRank:6,
            baseCost:3
        }
    });   
    
    CriticalDelay = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Critical Delay", 
            types:{'Crit Chance':8, 'Fire Rate':-6}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    CryoRounds = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Cryo Rounds", 
            types:{'Freeze':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });    
    
    FastHands = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Fast Hands", 
            types:{'Reload Speed':5}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:1
        }
    });
    
    HammerShot = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Hammer Shot", 
            types:{'Crit Damage':15}, 
            maxRanks:4, 
            currentRank:4,
            baseCost:5
        }
    });
    
    HeavyCaliber = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Heavy Caliber", 
            types:{'Damage':15, 'Recoil':15}, 
            maxRanks:11, 
            currentRank:11,
            baseCost:5
        }
    });
    
    Hellfire = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Hellfire", 
            types:{'Fire':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:5
        }
    });
    
    MagazineWarp = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Magazine Warp", 
            types:{'Magazine Capacity':5}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });

   
    
    PiercingHit = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Piercing Hit", 
            types:{'Armor Piercing':10}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    PointStrike = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Point Strike", 
            types:{'Crit Chance':25}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    Serration = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Serration", 
            types:{'Damage':15}, 
            maxRanks:11, 
            currentRank:11,
            baseCost:4
        }
    });
    
    SpeedTrigger = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Speed Trigger", 
            types:{'Fire Rate':10}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    Shred = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Shred", 
            types:{'Fire Rate':5}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:5
        }
    });

    SplitChamber = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Split Chamber", 
            types:{multishot:15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:9
        }
    });
    
    Stormbringer = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Stormbringer", 
            types:{'Electrical':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:5
        }
    });
    
    TaintedMag = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Tainted Mag", 
            types:{'Magazine Capacity':6, 'Reload Speed':-3}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:5
        }
    });
    
    VilePrecision = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Vile Precision", 
            types:{'Recoil':-10, 'Fire Rate':-6}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:5
        }
    });

    VitalSense = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Vital Sense", 
            types:{'Crit Damage':20}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    Wildfire = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Wildfire", 
            types:{'Magazine Capacity':5, 'Fire':15}, 
            maxRanks:4, 
            currentRank:4,
            baseCost:6
        }
    });

    
    //
    // Pistol mods
    //
    
    BarrelDiffusion = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Barrel Diffusion", 
            types:{multishot:20}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:5
        }
    });
    
    Convulsion = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Convulsion", 
            types:{'Electrical':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:5
        }
    });
    
    DeepFreeze = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Deep Freeze", 
            types:{'Freeze':10}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    Expel = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Expel", 
            types:{'Damage':5}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    Gunslinger = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Gunslinger", 
            types:{'Fire Rate':12}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    HeatedCharge = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Heated Charge", 
            types:{'Fire':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:5
        }
    });
    
    HollowPoint = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Hollow Point", 
            types:{'Crit Damage':10, 'Damage':-2.5}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    HornetStrike = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Hornet Strike", 
            types:{'Damage':20}, 
            maxRanks:11, 
            currentRank:11,
            baseCost:3
        }
    });
    
    IceStorm = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Ice Storm", 
            types:{'Magazine Capacity':10, 'Freeze':10}, 
            maxRanks:4, 
            currentRank:4,
            baseCost:5
        }
    });
    
    LethalTorrent = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Lethal Torrent", 
            types:{multishot:10, 'Fire Rate':10}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:5
        }
    });
    
    MagnumForce = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Magnum Force", 
            types:{'Damage':6, 'Recoil':8},
            maxRanks:11, 
            currentRank:11,
            baseCost:3
        }
    });
    
    NoReturn = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"No Return", 
            types:{'Armor Piercing':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:1
        }
    });
    
    PistolGambit = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Pistol Gambit", 
            types:{'Crit Chance':20}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    Quickdraw = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Quickdraw", 
            types:{'Reload Speed':8}, 
            maxRanks:6,
            currentRank:6,
            baseCost:1
        }
    });
    
    SlipMagazine = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Slip Magazine", 
            types:{'Magazine Capacity':5}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    StunningSpeed = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Stunning Speed", 
            types:{'Reload Speed':10}, 
            maxRanks:4, 
            currentRank:4,
            baseCost:5
        }
    });
    
    TaintedClip = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Tainted Clip", 
            types:{'Magazine Capacity':10, 'Reload Speed':-5}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:5
        }
    });
    
    TargetCracker = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Target Cracker", 
            types:{'Crit Damage':10}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    //
    // Shotgun mods
    //
    
    AcceleratedBlast = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Accelerated Blast", 
            types:{'Armor Piercing':15, 
            'Fire Rate':15}, 
            maxRanks:4, 
            currentRank:4,
            baseCost:5
        }
    });
    
    AmmoStock = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Ammo Stock", 
            types:{'Magazine Capacity':10}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:1
        }
    });
    
    Blaze = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Blaze", 
            types:{'Damage':15, 'Fire':15}, 
            maxRanks:6,
            currentRank:6,
            baseCost:5
        }
    });
    
    Blunderbuss = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Blunderbuss", 
            types:{'Crit Chance':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:4
        }
    });
    
    BurdenedShell = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Burdened Shell", 
            types:{'Magazine Capacity':10, 'Reload Speed':-3}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:6
        }
    });
    
    ChargedShell = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Charged Shell", 
            types:{'Electrical':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:6
        }
    });
    
    ChillingGrasp = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Chilling Grasp", 
            types:{'Freeze':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    Cleanse = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Cleanse", 
            types:{'Damage':5}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    Flechette = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Flechette", 
            types:{'Armor Piercing':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    HellsChamber = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Hell's Chamber", 
            types:{multishot:20}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:9
        }
    });
    
    IncindiaryCoat = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Incindiary Coat", 
            types:{'Fire':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:5
        }
    });
    
    PointBlank = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Point Blank", 
            types:{'Damage':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    Ravage = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Ravage", 
            types:{'Crit Damage':10}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    ShotgunSpazz = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Shotgun Spazz", 
            types:{'Fire Rate':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    TacticalPump = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Tactical Pump", 
            types:{'Reload Speed':5}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:1
        }
    });
    
    TaintedShell = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Tainted Shell", 
            types:{'Spread':-7, 'Fire Rate':-6}, 
            maxRanks:11, 
            currentRank:11,
            baseCost:3
        }
    });
    
    ViciousSpread = Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Vicious Spread", 
            types:{'Spread':10, 'Damage':15}, 
            maxRanks:6, 
            currentRank:6,
            baseCost:3
        }
    });
    
    getMod = function(modName){
        return new window[modName]();
    };
    
   getNewPistolModCollection = function(buildType){
       var mods = {};
       switch(buildType){
           case 'acrid':
               mods = new ModuleCollection([
                        new HornetStrike(), 
                        new LethalTorrent(), 
                        new NoReturn(), 
                        new Gunslinger(), 
                        new Quickdraw(), 
                        new SlipMagazine({currentRank:0}), 
                        new StunningSpeed(), 
                        new HeatedCharge({currentRank:0}), 
                        new DeepFreeze({currentRank:0}), 
                        new Convulsion({currentRank:0}), 
                        new Expel(),
                        new IceStorm(),
                        new PistolGambit({currentRank:0}),
                        new TargetCracker({currentRank:0}),
                        new HollowPoint({currentRank:0}),
                        new MagnumForce({currentRank:0}),
                        new TaintedClip({currentRank:0})
                    ]);
               break;
           case 'elemental':
               mods = new ModuleCollection([
                        new HornetStrike(), 
                        new LethalTorrent(), 
                        new NoReturn(), 
                        new Gunslinger(), 
                        new Quickdraw({currentRank:0}), 
                        new SlipMagazine({currentRank:0}), 
                        new StunningSpeed(), 
                        new HeatedCharge(), 
                        new DeepFreeze({currentRank:0}), 
                        new Convulsion(), 
                        new Expel({currentRank:0}),
                        new IceStorm(),
                        new PistolGambit({currentRank:0}),
                        new TargetCracker({currentRank:0}),
                        new HollowPoint({currentRank:0}),
                        new MagnumForce({currentRank:0}),
                        new TaintedClip({currentRank:0})
                    ]);
               break;
           case 'crit':
               mods = new ModuleCollection([
                        new HornetStrike(), 
                        new LethalTorrent(), 
                        new NoReturn(), 
                        new Gunslinger(), 
                        new Quickdraw(), 
                        new SlipMagazine({currentRank:0}), 
                        new StunningSpeed(), 
                        new HeatedCharge({currentRank:0}), 
                        new DeepFreeze({currentRank:0}), 
                        new Convulsion({currentRank:0}), 
                        new Expel({currentRank:0}),
                        new IceStorm({currentRank:0}),
                        new PistolGambit(),
                        new TargetCracker(),
                        new HollowPoint({currentRank:0}),
                        new MagnumForce({currentRank:0}),
                        new TaintedClip({currentRank:0})
                    ]);
               break;
           case 'speed':
               mods = new ModuleCollection([
                        new HornetStrike(), 
                        new LethalTorrent(), 
                        new NoReturn(), 
                        new Gunslinger(), 
                        new Quickdraw(), 
                        new SlipMagazine(), 
                        new StunningSpeed(), 
                        new HeatedCharge({currentRank:0}), 
                        new DeepFreeze({currentRank:0}), 
                        new Convulsion({currentRank:0}), 
                        new Expel(),
                        new IceStorm({currentRank:0}),
                        new PistolGambit({currentRank:0}),
                        new TargetCracker({currentRank:0}),
                        new HollowPoint({currentRank:0}),
                        new MagnumForce({currentRank:0}),
                        new TaintedClip({currentRank:0})
                    ]);
               break;
           case 'continous':
               mods = new ModuleCollection([
                        new HornetStrike(), 
                        new LethalTorrent(), 
                        new NoReturn(), 
                        new Gunslinger({currentRank:0}), 
                        new Quickdraw({currentRank:0}), 
                        new SlipMagazine({currentRank:0}), 
                        new StunningSpeed(), 
                        new HeatedCharge({currentRank:0}), 
                        new DeepFreeze({currentRank:0}), 
                        new Convulsion({currentRank:0}), 
                        new Expel(),
                        new IceStorm(),
                        new PistolGambit(),
                        new TargetCracker(),
                        new HollowPoint({currentRank:0}),
                        new MagnumForce({currentRank:0}),
                        new TaintedClip({currentRank:0})
                    ]);
               break;
           default:
               mods = new ModuleCollection([
                        new HornetStrike(), 
                        new LethalTorrent(), 
                        new NoReturn(), 
                        new Gunslinger(), 
                        new Quickdraw(), 
                        new SlipMagazine(), 
                        new StunningSpeed(), 
                        new HeatedCharge({currentRank:0}), 
                        new DeepFreeze({currentRank:0}), 
                        new Convulsion({currentRank:0}), 
                        new Expel({currentRank:0}),
                        new IceStorm(),
                        new PistolGambit({currentRank:0}),
                        new TargetCracker({currentRank:0}),
                        new HollowPoint({currentRank:0}),
                        new MagnumForce({currentRank:0}),
                        new TaintedClip({currentRank:0})
                    ]);
       }
       return mods;
    };    
    
    getNewRifleModCollection = function(buildType){
        var mods = {};
        switch(buildType){
            case 'elemental':
                mods = new ModuleCollection([
                            new Serration(), 
                            new SplitChamber(), 
                            new SpeedTrigger(),
                            new PiercingHit(), 
                            new Shred({currentRank:0}), 
                            new FastHands({currentRank:0}), 
                            new MagazineWarp({currentRank:0}), 
                            new PointStrike({currentRank:0}), 
                            new VitalSense({currentRank:0}), 
                            new Hellfire(), 
                            new CryoRounds(), 
                            new Stormbringer(),
                            new Wildfire(),
                            new HammerShot({currentRank:0}),
                            new Bane({currentRank:0}),
                            new CriticalDelay({currentRank:0}),
                            new HeavyCaliber({currentRank:0}),
                            new TaintedMag({currentRank:0}),
                            new VilePrecision({currentRank:0})
                        ]);
               break;
            case 'crit':
                mods = new ModuleCollection([
                            new Serration(), 
                            new SplitChamber(), 
                            new SpeedTrigger(),
                            new PiercingHit(), 
                            new Shred({currentRank:0}), 
                            new FastHands({currentRank:0}), 
                            new MagazineWarp({currentRank:0}), 
                            new PointStrike(), 
                            new VitalSense(), 
                            new Hellfire({currentRank:0}), 
                            new CryoRounds({currentRank:0}), 
                            new Stormbringer({currentRank:0}),
                            new Wildfire(),
                            new HammerShot(),
                            new Bane({currentRank:0}),
                            new CriticalDelay({currentRank:0}),
                            new HeavyCaliber({currentRank:0}),
                            new TaintedMag({currentRank:0}),
                            new VilePrecision({currentRank:0})
                     ]);
                break;
            case 'continous':
                mods = new ModuleCollection([
                            new Serration(), 
                            new SplitChamber(), 
                            new SpeedTrigger({currentRank:0}),
                            new PiercingHit(), 
                            new Shred({currentRank:0}), 
                            new FastHands({currentRank:0}), 
                            new MagazineWarp({currentRank:0}), 
                            new PointStrike(), 
                            new VitalSense(), 
                            new Hellfire({currentRank:0}), 
                            new CryoRounds({currentRank:0}), 
                            new Stormbringer({currentRank:0}),
                            new Wildfire(),
                            new HammerShot(),
                            new Bane(),
                            new CriticalDelay({currentRank:0}),
                            new HeavyCaliber({currentRank:0}),
                            new TaintedMag({currentRank:0}),
                            new VilePrecision({currentRank:0})
                     ]);
                break;
            case 'continousElemental':
                mods = new ModuleCollection([
                            new Serration(), 
                            new SplitChamber(), 
                            new SpeedTrigger({currentRank:0}),
                            new PiercingHit({currentRank:0}), 
                            new Shred({currentRank:0}), 
                            new FastHands({currentRank:0}), 
                            new MagazineWarp({currentRank:0}), 
                            new PointStrike(), 
                            new VitalSense(), 
                            new Hellfire(), 
                            new CryoRounds(), 
                            new Stormbringer(),
                            new Wildfire(),
                            new HammerShot({currentRank:0}),
                            new Bane({currentRank:0}),
                            new CriticalDelay({currentRank:0}),
                            new HeavyCaliber({currentRank:0}),
                            new TaintedMag({currentRank:0}),
                            new VilePrecision({currentRank:0})
                     ]);
                break;
            case 'ogris':
                mods = new ModuleCollection([
                            new Serration(), 
                            new SplitChamber(), 
                            new SpeedTrigger({currentRank:0}),
                            new PiercingHit(), 
                            new Shred({currentRank:0}), 
                            new FastHands({currentRank:0}), 
                            new MagazineWarp({currentRank:0}), 
                            new PointStrike({currentRank:0}), 
                            new VitalSense({currentRank:0}), 
                            new Hellfire(), 
                            new CryoRounds(), 
                            new Stormbringer(),
                            new Wildfire(),
                            new HammerShot({currentRank:0}),
                            new Bane({currentRank:0}),
                            new CriticalDelay({currentRank:0}),
                            new HeavyCaliber(),
                            new TaintedMag({currentRank:0}),
                            new VilePrecision({currentRank:0})
                     ]);
                break;
            case 'torid':
                mods = new ModuleCollection([
                            new Serration(), 
                            new SplitChamber(), 
                            new SpeedTrigger(),
                            new PiercingHit(), 
                            new Shred(), 
                            new FastHands(), 
                            new MagazineWarp({currentRank:0}), 
                            new PointStrike({currentRank:0}), 
                            new VitalSense({currentRank:0}), 
                            new Hellfire({currentRank:0}), 
                            new CryoRounds({currentRank:0}), 
                            new Stormbringer({currentRank:0}),
                            new Wildfire(),
                            new HammerShot({currentRank:0}),
                            new Bane(),
                            new CriticalDelay({currentRank:0}),
                            new HeavyCaliber({currentRank:0}),
                            new TaintedMag({currentRank:0}),
                            new VilePrecision({currentRank:0})
                        ]);
               break;
            default:
                mods = new ModuleCollection([
                            new Serration(), 
                            new SplitChamber(), 
                            new SpeedTrigger(),
                            new PiercingHit(), 
                            new Shred({currentRank:0}), 
                            new FastHands({currentRank:0}), 
                            new MagazineWarp({currentRank:0}), 
                            new PointStrike(), 
                            new VitalSense(), 
                            new Hellfire({currentRank:0}), 
                            new CryoRounds({currentRank:0}), 
                            new Stormbringer({currentRank:0}), 
                            new Wildfire(),
                            new HammerShot(),
                            new Bane({currentRank:0}),
                            new CriticalDelay({currentRank:0}),
                            new HeavyCaliber({currentRank:0}),
                            new TaintedMag({currentRank:0}),
                            new VilePrecision({currentRank:0})
                        ]);
                
        }
        return mods;
    };
    
    getNewShotgunModCollection = function(buildType){
        var mods = {};
        switch(buildType){
            case 'crit':
                mods = new ModuleCollection([
                            new PointBlank,
                            new HellsChamber(),
                            new AcceleratedBlast(), 
                            new Blaze(),
                            new Flechette(),
                            new IncindiaryCoat({currentRank:0}),
                            new ChargedShell({currentRank:0}), 
                            new ChillingGrasp({currentRank:0}),
                            new Cleanse({currentRank:0}),
                            new AmmoStock({currentRank:0}),
                            new Blunderbuss(),
                            new Ravage(),
                            new ShotgunSpazz(),
                            new TacticalPump({currentRank:0}),
                            new BurdenedShell({currentRank:0}),
                            new TaintedShell({currentRank:0}),
                            new ViciousSpread({currentRank:0})
                        ]);
               break;
            default:
                mods = new ModuleCollection([
                            new PointBlank,
                            new HellsChamber(),
                            new AcceleratedBlast(), 
                            new Blaze(),
                            new Flechette(),
                            new IncindiaryCoat({currentRank:0}),
                            new ChargedShell({currentRank:0}), 
                            new ChillingGrasp({currentRank:0}),
                            new Cleanse({currentRank:0}),
                            new AmmoStock({currentRank:0}),
                            new Blunderbuss(),
                            new Ravage(),
                            new ShotgunSpazz(),
                            new TacticalPump({currentRank:0}),
                            new BurdenedShell({currentRank:0}),
                            new TaintedShell({currentRank:0}),
                            new ViciousSpread({currentRank:0})
                        ]);
        }
        return mods;
    };
    
    return this;
});