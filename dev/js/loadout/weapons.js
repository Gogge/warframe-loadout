define(['jquery', 'underscore', 'backbone', 'loadout/modules', 'loadout/enemies', 'loadout/auras'],
function   ($, _, Backbone, Modules, Enemies, Auras) {
    
    //
    //  Weapons
    //

    Weapon = Backbone.Model.extend({
       initialize:function(){
        if(!this.get('modules')){this.set('modules', Modules.getNewPistolModCollection());};
        if(!this.get('auras')){this.set('auras', Auras.getNewAuraCollection());};
        
        this.updateModuleDps();
       },
       defaults: {
           name:"Default weapon"
       },
       specialDamageCalculations:function(){
           return {};
       },
       getCalculatedModPercentages:function(){
           var module_types = {'Damage':0, 'Faction Damage':0, 'Armor Piercing':0, 'Fire':0, 'Electrical':0, 'Freeze':0, 'Crit Chance':0, 'Crit Damage':0, 'Multishot':0, 'Fire Rate':0, 'Reload Speed':0, 'Magazine Capacity':0};
           this.get('modules').each(function(module){
               var calculated_mods = module.getPercents();
               for(var key in calculated_mods){
                    if(module_types[key]){
                        module_types[key] = module_types[key] + calculated_mods[key];
                    } else {
                        module_types[key] = calculated_mods[key];
                    }
                }
           });
           return module_types;
       },
        getDps:function(module_types, enemy){
            var infestedCharger = new Enemies.InfestedCharger();
            var grineerTrooper = new Enemies.GrineerTrooper();
            var corpusCrewman = new Enemies.CorpusCrewman();
            var damageType = this.get('damageType');
            var result = {};
            result['damageBreakdown'] = {};
            result['damageBreakdown'][damageType] = 0;
            result['damageBreakdown']['Armor Piercing'] = 0;
            result['damageBreakdown']['Fire'] = 0;
            result['damageBreakdown']['Electrical'] = 0;
            result['damageBreakdown']['Freeze'] = 0;
            var damage = 0;
            var rifleAmp = 0;
            // Rifle amp
            if((this.get('weaponType') === "rifle") || (this.get('weaponType') === "sniper") || (this.get('weaponType') === "bow")){
                rifleAmp = this.get('auras').where({name:"Rifle Amp"})[0].getPercents()["Rifle Damage"];
            }
            var baseDamage = this.get('damage');
            var corrosiveProjection = this.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];

            // Add serration type mods and rifle amp
            baseDamage = baseDamage * (100 + module_types['Damage'] + rifleAmp) / 100;
            
            // Add faction damage mods, bane, cleanse, expel
            baseDamage = baseDamage * (100 + module_types['Faction Damage']) / 100;
            
            
            damage = baseDamage;

            // Add crit
            var statCritChance = Math.min(this.get('Crit Chance') * (100 + module_types['Crit Chance']) / 100, 1.0);
            // The critical damage calculations are for total damage (includes the base 100%), so we exclude that part to get only the critical damage portion
            var statCritDamage = this.get('Crit Damage') * (100 + module_types['Crit Damage']) / 100;
            var criticalDamage = damage * statCritChance * (statCritDamage - 1.0);
            damage += criticalDamage;

            result['damageBreakdown'][damageType] = damage;

            // Add elemental type mods
            var armorPiercing = damage * module_types['Armor Piercing'] / 100;
            var fire = damage * module_types['Fire'] / 100;
            var electrical = damage * module_types['Electrical'] / 100;
            var freeze = damage * module_types['Freeze'] / 100;
            result['damageBreakdown']['Armor Piercing'] += armorPiercing;
            result['damageBreakdown']['Fire'] += fire;
            result['damageBreakdown']['Electrical'] += electrical;
            result['damageBreakdown']['Freeze'] += freeze;

            var basePlusElementalDamage = damage + armorPiercing + fire + electrical + freeze;
            damage = basePlusElementalDamage;
            

            //Add others
            var fireRate = 1.0;
            if (this.get('continous')){
                fireRate = this.get('Fire Rate');
            } else {
                fireRate = this.get('Fire Rate') * (100 + module_types['Fire Rate']) / 100;
            }
            // Note that the "'Reload Speed'" attribute is really reload time
            var reloadSpeed = this.get('Reload Speed') / ((100 + module_types['Reload Speed']) / 100);
            var magazineCapacity = Math.round(this.get('Magazine Capacity') * (100 + module_types['Magazine Capacity']) / 100);

            // The special damage is the weapon's extra custom damage function
            // eg. Acrid's 75% extra damage poison dot
            
            var specialDamage = this.specialDamageCalculations(result['damageBreakdown'], module_types);
            for(var key in specialDamage){
                if(!result['damageBreakdown'][key]){result['damageBreakdown'][key] = 0;}
                result['damageBreakdown'][key] += specialDamage[key];
            };
            
            
            var totalDamage = 0;
            result['dpsBreakdown'] = {};
            result['burstBreakdown'] = {};
            var multishotDamage = 0.0;
            for (var key in result['damageBreakdown']){
                // Add multishot
                multishotDamage += result['damageBreakdown'][key] * module_types['Multishot'] / 100;
                result['damageBreakdown'][key] = result['damageBreakdown'][key] + (result['damageBreakdown'][key] * module_types['Multishot'] / 100);
                
                // Calculate individual element DPS
                result['dpsBreakdown'][key] = (result['damageBreakdown'][key] * magazineCapacity) / (magazineCapacity / fireRate + reloadSpeed);
                result['burstBreakdown'][key] = result['damageBreakdown'][key] * fireRate;

                totalDamage += result['damageBreakdown'][key];
            }
            
            var dps = (totalDamage * magazineCapacity) / (magazineCapacity / fireRate + reloadSpeed);
            var burst = totalDamage * fireRate;
            
            // Note to self: remember to add new results in the constructor if used for sorting
            result['dps'] = dps;
            result['shot'] = totalDamage;
            result['burst'] = burst;
            result['baseDamage'] = baseDamage;
            result['criticalDamage'] = criticalDamage;
            result['multishotDamage'] = multishotDamage;
            result['Fire Rate'] = fireRate;
            result['Reload Speed'] = reloadSpeed;
            result['Magazine Capacity'] = magazineCapacity;
            result['Crit Chance'] = statCritChance;
            result['Crit Damage'] = statCritDamage;
            
            result['stats'] = {};
            result['stats']['Fire Rate'] = fireRate;
            result['stats']['Reload Speed'] = reloadSpeed;
            result['stats']['Magazine Capacity'] = magazineCapacity;
            result['stats']['Crit Chance'] = statCritChance;
            result['stats']['Crit Damage'] = statCritDamage;
            
            result['infestedDps'] = infestedCharger.getDamageTaken(result, 1, corrosiveProjection);
            result['grineerDps'] = grineerTrooper.getDamageTaken(result, 1, corrosiveProjection);
            result['corpusDps'] = corpusCrewman.getDamageTaken(result, 1, corrosiveProjection);
            var apDps = new Enemies.AncientDisruptor().getDamageTaken(result, 200, corrosiveProjection);
            result['apdps'] = apDps;
            
            return result;
        },
        updateModuleDps:function(){
            
            // Used after updating module stats (and weapon init) to re-calculate how much
            // one mod level gives in DPS
            var infestedCharger = new Enemies.InfestedCharger();
            var grineerTrooper = new Enemies.GrineerTrooper();
            var corpusCrewman = new Enemies.CorpusCrewman();
            var weapon = this;
            var modPercentages = this.getCalculatedModPercentages();
            var enemy = new Enemies.Enemy();
            var weaponResult = weapon.getDps(modPercentages, enemy);
            this.set('result', weaponResult);
            this.set('dps', weaponResult.dps);
            this.set('apdps', weaponResult.apdps);
            this.set('burst', weaponResult.burst);
            this.set('shot', weaponResult.shot);
            this.set('infestedDps', infestedCharger.getDamageTaken(weaponResult));
            this.set('grineerDps', grineerTrooper.getDamageTaken(weaponResult));
            this.set('corpusDps', corpusCrewman.getDamageTaken(weaponResult));
            
            var baseDps = weaponResult.dps;
            var baseApDps = weaponResult.apdps;

            var activeModCount = 0;
            var activeModPoints = 0;

            this.get('modules').each(function(module){
                
                var diffDps = 0;
                var diffApDps = 0;
                if(module.get('currentRank') === module.get('maxRanks')) {
                    module.decreaseModlevel();
                    var newModPercentages = weapon.getCalculatedModPercentages();
                    var newWeaponResult = weapon.getDps(newModPercentages, enemy);
                    var newDps = newWeaponResult.dps;
                    var newApDps = newWeaponResult.apdps;
                    diffDps =  baseDps - newDps;
                    diffApDps = baseApDps - newApDps;
                    module.increaseModlevel();
                } else {
                    // Mod level is either 0 or higher, but not maxed, so we can increase mod level
                    module.increaseModlevel();
                    var newModPercentages = weapon.getCalculatedModPercentages();
                    var newWeaponResult = weapon.getDps(newModPercentages, enemy);
                    var newDps = newWeaponResult.dps;
                    var newApDps = newWeaponResult.apdps;
                    diffDps =  newDps - baseDps;
                    diffApDps = newApDps - baseApDps;
                    module.decreaseModlevel();
                }
                module.set('moduleDpsDifference', diffDps);
                module.set('moduleArmorPiercingDpsDifference', diffApDps);
                if (module.get('currentRank') > 0){
                    activeModCount++;
                    activeModPoints += module.get('currentRank');
                    activeModPoints += module.get('baseCost');
                }
            });
            
            this.get('auras').each(function(aura){
                var diffDps = 0;
                var diffApDps = 0;
                var modPercentages = weapon.getCalculatedModPercentages();
                if(aura.get('currentRank') === aura.get('maxRanks')) {
                    aura.decreaseModlevel();
                    var newWeaponResult = weapon.getDps(modPercentages, enemy);
                    var newDps = newWeaponResult.dps;
                    var newApDps = newWeaponResult.apdps;
                    diffDps =  baseDps - newDps;
                    diffApDps = baseApDps - newApDps;
                    aura.increaseModlevel();
                } else {
                    // Mod level is either 0 or higher, but not maxed, so we can increase mod level
                    aura.increaseModlevel();
                    var newWeaponResult = weapon.getDps(modPercentages, enemy);
                    var newDps = newWeaponResult.dps;
                    var newApDps = newWeaponResult.apdps;
                    diffDps =  newDps - baseDps;
                    diffApDps = newApDps - baseApDps;
                    aura.decreaseModlevel();
                }
                aura.set('moduleDpsDifference', diffDps);
                aura.set('moduleArmorPiercingDpsDifference', diffApDps);
            });

            weapon.set('activeModCount', activeModCount);
            weapon.set('activeModPoints', activeModPoints);
            
        },
        getSimpleString:function(){
            // Used in cookies to remember weapons/mods in favorites
            var mods = {};
            var auras = {};
            this.get('modules').each(function(module){
                mods[module.get('name')] = module.get('currentRank');
            });
            this.get('auras').each(function(aura){
                auras[aura.get('name')] = aura.get('currentRank');
            });
            return {name:this.get('name'), mods:mods, auras:auras};
        }
    });

    WeaponCollection = Backbone.Collection.extend({
       model: Weapon,
       initialize:function(){
            this.sort_key = 'name';
            this.sort_asc = [];
            this.sort_asc['name'] = true;
            this.sort_asc['dps'] = true;
            this.sort_asc['apdps'] = true;
            this.secondary_sort_key = 'dps';
            this.secondary_sort_key = 'desc';
       },
       comparator: function(a, b) {
            // Primary/secondary sort is from old designs, should probably clean it up
            var a_pri = a.get(this.sort_key);
            var b_pri = b.get(this.sort_key);
            var a_sec = a.get(this.secondary_sort_key);
            var b_sec = b.get(this.secondary_sort_key);
            
            var ret = a_pri > b_pri ?  1
                 : a_pri < b_pri ? -1
                 :          0;
            if(ret === 0){
                ret = a_sec > b_sec ?  1
                 : a_sec < b_sec ? -1
                 :          0;
            }
            if(!this.sort_asc[this.sort_key]) {
                ret *= -1;
            }
            return ret;
        }
    });
    
    //
    // Pistols
    //

    weaponList = new WeaponCollection([

        new (Acrid = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewPistolModCollection('acrid'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"pistol", 
             name : "Acrid",
             masteryRank:7,
             damageType:"Poison",
             prettyDamageType:"Poison",
             damage : 25, 
             'Fire Rate' : 6.67, 
             'Magazine Capacity' : 15, 
             'Reload Speed' : 1.2, 
             'Crit Chance' : 0.025, 
             'Crit Damage' : 1.5  
           },
            specialDamageCalculations:function(damageBreakdown){
               var damage = {};
               for (var key in damageBreakdown){
                    damage[key] = damageBreakdown[key] * 0.75 * 4;
                }
               return damage;
            }
        })),

        new (Afuris = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Afuris",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 14, 
            'Fire Rate' : 20, 
            'Magazine Capacity' : 70, 
            'Reload Speed' : 2.8, 
            'Crit Chance' : 0.05, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Akbolto = Weapon.extend({
           initialize:function(){
             //console.log("Akbolto init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Akbolto",
            masteryRank:0,
            damageType:"Physics Impact",
            prettyDamageType:"Physics Impact",
            damage : 25, 
            'Fire Rate' : 10, 
            'Magazine Capacity' : 30, 
            'Reload Speed' : 2.6, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Aklato = Weapon.extend({
           initialize:function(){
             //console.log("Aklato init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Aklato",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 24, 
            'Fire Rate' : 8.33, 
            'Magazine Capacity' : 30, 
            'Reload Speed' : 2.4, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
           }
        })),
        
        new (Ballistica = Weapon.extend({
           initialize:function(){
             //console.log("Bolto init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Ballistica (burst)",
            masteryRank:0,
            damageType:"Physics Impact",
            prettyDamageType:"Physics Impact",
            damage : 25, 
            'Fire Rate' : 3.3, 
            'Magazine Capacity' : 16, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
           }
        })),
        
        new (Ballistica = Weapon.extend({
           initialize:function(){
             //console.log("Bolto init!");
             this.set('modules', Modules.getNewPistolModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Ballistica (charge)",
            masteryRank:0,
            damageType:"Physics Impact",
            prettyDamageType:"Physics Impact",
            damage : 100, 
            'Fire Rate' : 0.769, // (1 / 1.3), 1 sec charge, + 0.3 sec (1/3.3  = 0.3) between shots
            'Magazine Capacity' : 16, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.15, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Bolto = Weapon.extend({
           initialize:function(){
             //console.log("Bolto init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Bolto",
            masteryRank:0,
            damageType:"Physics Impact",
            prettyDamageType:"Physics Impact",
            damage : 25, 
            'Fire Rate' : 6.83, 
            'Magazine Capacity' : 15, 
            'Reload Speed' : 2.3, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
           }
        })),
        
        new (Brakk = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewPistolModCollection('continous'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Brakk",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 150, 
            'Fire Rate' : 5, 
            'Magazine Capacity' : 5, 
            'Reload Speed' : 1, 
            'Crit Chance' : 0.15, 
            'Crit Damage' : 2.0  
           }
        })),

        new (Bronco = Weapon.extend({
           initialize:function(){
             //console.log("Bronco init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Bronco",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 105, 
            'Fire Rate' : 5.0, 
            'Magazine Capacity' : 2, 
            'Reload Speed' : 1.05, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
           }
        })),

        new (BroncoPrime = Weapon.extend({
           initialize:function(){
             //console.log("Bronco Prime init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Bronco Prime",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 140, 
            'Fire Rate' : 4.2, 
            'Magazine Capacity' : 4, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Despair = Weapon.extend({
           initialize:function(){
             //console.log("Despair init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Despair",
            masteryRank:0,
            damageType:"Armor Piercing",
            prettyDamageType:"Armor Piercing",
            damage : 55, 
            'Fire Rate' : 3.3, 
            'Magazine Capacity' : 10, 
            'Reload Speed' : 0.75, 
            'Crit Chance' : 0.0, 
            'Crit Damage' : 0.0  
           }
        })),

        new (DualBroncos = Weapon.extend({
           initialize:function(){
             //console.log("Dual Broncos init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Dual Broncos",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 105, 
            'Fire Rate' : 8.3, 
            'Magazine Capacity' : 4, 
            'Reload Speed' : 2.2, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
           }
        })),

        new (DualVastos = Weapon.extend({
           initialize:function(){
             //console.log("Dual Vastos init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Dual Vastos",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 50, 
            'Fire Rate' : 10, 
            'Magazine Capacity' : 12, 
            'Reload Speed' : 2, 
            'Crit Chance' : 0.15, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Embolist = Weapon.extend({
           initialize:function(){
             //console.log("Embolist init!");
             this.set('modules', Modules.getNewPistolModCollection('continous'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            continous:true,
            weaponType:"pistol", 
            name : "Embolist",
            masteryRank:8,
            damageType:"Poison",
            prettyDamageType:"Poison",
            damage : 15,
            'Fire Rate' : 17,
            'Magazine Capacity' : 100, 
            'Reload Speed' : 1.5, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 2.0  
           }
        })),

        new (Furis = Weapon.extend({
           initialize:function(){
             //console.log("Furis init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Furis",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 14,
            'Fire Rate' : 10,
            'Magazine Capacity' : 35, 
            'Reload Speed' : 1.4, 
            'Crit Chance' : 0.05, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Hikou = Weapon.extend({
           initialize:function(){
             //console.log("Furis init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Hikou",
            masteryRank:2,
            damageType:"Serrated Blade",
            prettyDamageType:"Serrated Blade",
            damage : 25,
            'Fire Rate' : 6.67,
            'Magazine Capacity' : 20, 
            'Reload Speed' : 0.75, 
            'Crit Chance' : 0.05, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Kraken = Weapon.extend({
           initialize:function(){
             //console.log("Kraken init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Kraken",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 45,
            'Fire Rate' : 2.8,
            'Magazine Capacity' : 14, 
            'Reload Speed' : 2.4, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Kunai = Weapon.extend({
           initialize:function(){
             //console.log("Kraken init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Kunai",
            masteryRank:2,
            damageType:"Physics Impact",
            prettyDamageType:"Physics Impact",
            damage : 45,
            'Fire Rate' : 3.3,
            'Magazine Capacity' : 10, 
            'Reload Speed' : 0.8, 
            'Crit Chance' : 0.05, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Lato = Weapon.extend({
           initialize:function(){
             //console.log("Lato init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Lato",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 24,
            'Fire Rate' : 6.7,
            'Magazine Capacity' : 15, 
            'Reload Speed' : 1.2, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
           }
        })),

        new (LatoPrime = Weapon.extend({
           initialize:function(){
             //console.log("Lato Prime init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Lato Prime",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 27,
            'Fire Rate' : 6.7,
            'Magazine Capacity' : 15, 
            'Reload Speed' : 1.2, 
            'Crit Chance' : 0.05, 
            'Crit Damage' : 1.5  
           }
        })),

        new (LatoVandal = Weapon.extend({
           initialize:function(){
             //console.log("Lato Prime init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Lato Vandal",
            masteryRank:1,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 30,
            'Fire Rate' : 5.0,
            'Magazine Capacity' : 15, 
            'Reload Speed' : 1.2, 
            'Crit Chance' : 0.075, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Lex = Weapon.extend({
           initialize:function(){
             //console.log("Lex init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Lex",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 70,
            'Fire Rate' : 1.1,
            'Magazine Capacity' : 6, 
            'Reload Speed' : 2.35, 
            'Crit Chance' : 0.15, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Seer = Weapon.extend({
           initialize:function(){
             //console.log("Seer init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Seer",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 83,
            'Fire Rate' : 2.0,
            'Magazine Capacity' : 8, 
            'Reload Speed' : 3.0, 
            'Crit Chance' : 0.0, 
            'Crit Damage' : 1.0  
           }
        })),

        new (Sicarus = Weapon.extend({
           initialize:function(){
             //console.log("Sicarus init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Sicarus",
            masteryRank:1,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 26,
            'Fire Rate' : 3.5,
            'Magazine Capacity' : 15, 
            'Reload Speed' : 1.9, 
            'Crit Chance' : 0.10, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Spectra = Weapon.extend({
           initialize:function(){
             //console.log("Spectra init!");
             this.set('modules', Modules.getNewPistolModCollection('continous'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            continous:true,
            weaponType:"pistol", 
            name : "Spectra",
            masteryRank:4,
            damageType:"Serrated Blade",
            prettyDamageType:"Serrated Blade",
            damage : 8,
            'Fire Rate' : 10.0,
            'Magazine Capacity' : 50, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.05, 
            'Crit Damage' : 2.0  
           }
        })),

        new (TwinGremlins = Weapon.extend({
           initialize:function(){
             //console.log("Twin Gremlins init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Twin Gremlins",
            masteryRank:0,
            damageType:"Physics Impact",
            prettyDamageType:"Physics Impact",
            damage : 30,
            'Fire Rate' : 5.0,
            'Magazine Capacity' : 30, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
           }
        })),

        new (TwinVipers = Weapon.extend({
           initialize:function(){
             //console.log("Twin Vipers init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Twin Vipers",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 16,
            'Fire Rate' : 25.0,
            'Magazine Capacity' : 28, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.15, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Vasto = Weapon.extend({
           initialize:function(){
             //console.log("Vasto init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Vasto",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 50,
            'Fire Rate' : 5.0,
            'Magazine Capacity' : 6, 
            'Reload Speed' : 1.0, 
            'Crit Chance' : 0.15, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Viper = Weapon.extend({
           initialize:function(){
             //console.log("Viper init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Viper",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 16,
            'Fire Rate' : 14.4,
            'Magazine Capacity' : 14, 
            'Reload Speed' : 1.1, 
            'Crit Chance' : 0.15, 
            'Crit Damage' : 1.5  
           }
        })),

        //
        // Rifles
        //

        new (Boltor = Weapon.extend({
           initialize:function(){
             //console.log("Boltor init!");
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Boltor",
             masteryRank:2,
             damageType:"Physics Impact",
             prettyDamageType:"Physica Impact",
             damage : 18, 
             'Fire Rate' : 8.75, 
             'Magazine Capacity' : 60, 
             'Reload Speed' : 2.6, 
             'Crit Chance' : 0.025, 
             'Crit Damage' : 1.5  
           }
        })),

        new (Braton = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Braton",
             masteryRank:0,
             damageType:"Bullet",
             prettyDamageType:"Bullet",
             damage : 20, 
             'Fire Rate' : 11.25, 
             'Magazine Capacity' : 45, 
             'Reload Speed' : 2.37, 
             'Crit Chance' : 0.025, 
             'Crit Damage' : 1.5  
           }
        })),

        new (BratonPrime = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Braton Prime",
             masteryRank:0,
             damageType:"Bullet",
             prettyDamageType:"Bullet",
             damage : 25, 
             'Fire Rate' : 10.0, 
             'Magazine Capacity' : 50, 
             'Reload Speed' : 2.4, 
             'Crit Chance' : 0.025, 
             'Crit Damage' : 1.5  
           }
        })),

        new (BratonVandal = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Braton Vandal",
             masteryRank:0,
             damageType:"Bullet",
             prettyDamageType:"Bullet",
             damage : 20, 
             'Fire Rate' : 9.38, 
             'Magazine Capacity' : 45, 
             'Reload Speed' : 2.3, 
             'Crit Chance' : 0.05, 
             'Crit Damage' : 1.5  
           }
        })),

        new (Burston = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Burston",
             masteryRank:0,
             damageType:"Bullet",
             prettyDamageType:"Bullet",
             damage : 30, 
             'Fire Rate' : 5.0, 
             'Magazine Capacity' : 45, 
             'Reload Speed' : 1.9, 
             'Crit Chance' : 0.05, 
             'Crit Damage' : 1.5  
           }
        })),

        new (Dera = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Dera",
             masteryRank:4,
             damageType:"laser",
             prettyDamageType:"Laser",
             damage : 22, 
             'Fire Rate' : 11.3, 
             'Magazine Capacity' : 45, 
             'Reload Speed' : 2.37, 
             'Crit Chance' : 0.025, 
             'Crit Damage' : 1.5  
           }
        })),

        new (FluxRifle = Weapon.extend({
           initialize:function(){
             //console.log("Flux Rifle init!");
             this.set('modules', Modules.getNewRifleModCollection('continous'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             continous:true,
             weaponType:"rifle", 
             name : "Flux Rifle",
             masteryRank:6,
             damageType:"Serrated Blade",
             prettyDamageType:"Serrated Blade",
             damage : 18.5,
             'Fire Rate' : 10.8, 
             'Magazine Capacity' : 100, 
             'Reload Speed' : 2.0, 
             'Crit Chance' : 0.05, 
             'Crit Damage' : 2.0  
           }
        })),

        new (Gorgon = Weapon.extend({
           initialize:function(){
             //console.log("Gorgon init!");
             this.set('modules', Modules.getNewRifleModCollection('elemental'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"rifle", 
            name : "Gorgon",
            masteryRank:3,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 24, 
            'Fire Rate' : 12.5,
            'Magazine Capacity' : 90, 
            'Reload Speed' : 4.2, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5
           }
        })),

        new (Grakata = Weapon.extend({
           initialize:function(){
             //console.log("Grakata init!");
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"rifle", 
            name : "Grakata",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 9, 
            'Fire Rate' : 20, 
            'Magazine Capacity' : 60, 
            'Reload Speed' : 2.37, 
            'Crit Chance' : 0.15, 
            'Crit Damage' : 2.0 
           }
        })),

        new (Hind = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Hind",
             masteryRank:0,
             damageType:"Bullet",
             prettyDamageType:"Bullet",
             damage : 30, 
             'Fire Rate' : 5.0, 
             'Magazine Capacity' : 65, 
             'Reload Speed' : 2.0, 
             'Crit Chance' : 0.05, 
             'Crit Damage' : 1.5  
           }
        })),

        new (Ignis = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('continousElemental'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             continous:true,
             weaponType:"rifle", 
             name : "Ignis",
             masteryRank:4,
             damageType:"Fire",
             prettyDamageType:"Fire",
             damage : 12.8, 
             'Fire Rate' : 11.7, 
             'Magazine Capacity' : 100, 
             'Reload Speed' : 2.0, 
             'Crit Chance' : 0.05, 
             'Crit Damage' : 2.0  
           }
        })),

        new (Latron = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Latron",
             masteryRank:0,
             damageType:"Bullet",
             prettyDamageType:"Bullet",
             damage : 40, 
             'Fire Rate' : 4.2, 
             'Magazine Capacity' : 15, 
             'Reload Speed' : 2.4, 
             'Crit Chance' : 0.075, 
             'Crit Damage' : 1.5  
           }
        })),

        new (LatronPrime = Weapon.extend({
           initialize:function(){
             //console.log("Latron Prime init!");
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Latron Prime",
             masteryRank:0,
             damageType:"Bullet",
             prettyDamageType:"Bullet",
             damage : 45, 
             'Fire Rate' : 4.17, 
             'Magazine Capacity' : 15, 
             'Reload Speed' : 2.4, 
             'Crit Chance' : 0.1, 
             'Crit Damage' : 1.5  
           }
        })),

        new (Mk1Braton = Weapon.extend({
           initialize:function(){
             //console.log("Latron Prime init!");
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "MK1-Braton",
             masteryRank:0,
             damageType:"Bullet",
             prettyDamageType:"Bullet",
             damage : 16, 
             'Fire Rate' : 6.3, 
             'Magazine Capacity' : 60, 
             'Reload Speed' : 2.2, 
             'Crit Chance' : 0.05, 
             'Crit Damage' : 1.5  
           }
        })),

        new (Ogris = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('ogris'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"rifle", 
            name : "Ogris",
             masteryRank:6,
            damageType:"Explosion",
            prettyDamageType:"Explosion",
            damage : 150,
            explosionDamage: 500,
            'Fire Rate' : 0.4,
            'Magazine Capacity' : 5, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.05, 
            'Crit Damage' : 2.0
           },
            specialDamageCalculations:function(damageBreakdown, module_types){
               var baseExplosionDamage = this.get('explosionDamage') * (100 + module_types['Damage']) / 100;
               baseExplosionDamage = baseExplosionDamage * (100 + module_types['Faction Damage']) / 100;
               var damage = {};
               var armorPiercing = baseExplosionDamage * module_types['Armor Piercing'] / 100;
               var fire = baseExplosionDamage * module_types['Fire'] / 100;
               var electrical = baseExplosionDamage * module_types['Electrical'] / 100;
               var freeze = baseExplosionDamage * module_types['Freeze'] / 100;
               damage["Explosion"] = baseExplosionDamage; 
               damage["Armor Piercing"] = armorPiercing;
               damage["Fire"] = fire;
               damage["Electrical"] = electrical;
               damage["Freeze"] = freeze;
               return damage;
            }
        })),

        new (Soma = Weapon.extend({
           initialize:function(){
             //console.log("Soma init!");
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"rifle", 
            name : "Soma",
            masteryRank:3,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 10, 
            'Fire Rate' : 15, 
            'Magazine Capacity' : 100, 
            'Reload Speed' : 3.0, 
            'Crit Chance' : 0.35, 
            'Crit Damage' : 3.0
           }
        })),

        new (Supra = Weapon.extend({
           initialize:function(){
             //console.log("Supra init!");
             this.set('modules', Modules.getNewRifleModCollection('elemental'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"rifle", 
            name : "Supra",
            masteryRank:7,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 35, 
            'Fire Rate' : 12.5,
            'Magazine Capacity' : 90, 
            'Reload Speed' : 4.2, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5
           }
        })),

        new (Synapse = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('continous'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            continous:true,
            weaponType:"rifle", 
            name : "Synapse",
            masteryRank:6,
            damageType:"Electrical",
            prettyDamageType:"Electrical",
            damage : 9.4,
            'Fire Rate' : 13.3,
            'Magazine Capacity' : 100, 
            'Reload Speed' : 1.5,
            'Crit Chance' : 0.5, 
            'Crit Damage' : 2.0
           }
        })),

        new (Torid = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('torid'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Torid",
             masteryRank:6,
             damageType:"Explosion",
             prettyDamageType:"Explosion",
             damage : 100,
             cloudTickDamage: 20,
             'Fire Rate' : 1.0, 
             'Magazine Capacity' : 5, 
             'Reload Speed' : 3.0, 
             'Crit Chance' : 0.05, 
             'Crit Damage' : 1.5  
           },
            specialDamageCalculations:function(damageBreakdown, module_types){
               var baseDotDamage = this.get('cloudTickDamage') * (100 + module_types['Damage']) / 100;
               baseDotDamage = baseDotDamage * (100 + module_types['Faction Damage']) / 100;
               var baseTimeInCloud = 12.0; 
               baseDotDamage *= baseTimeInCloud; // one tick per second
               var damage = {};
               if(!damage['Poison']) {damage['Poison'] = 0;};
               damage['Poison'] += baseDotDamage;
               // Add elemental effects from mods
               for (var key in damageBreakdown){
                    if(module_types[key]){
                        damage[key] = baseDotDamage * module_types[key] / 100;
                    }
               }
               return damage;
            }
        })),

        //
        // Shotguns
        //
        new (Boar = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Boar",
            masteryRank:2,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 96, 
            'Fire Rate' : 5,
            'Magazine Capacity' : 10,
            'Reload Speed' : 2.3,
            'Crit Chance' : 0.05,
            'Crit Damage' : 1.5
           }
        })),

        new (BoarPrime = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Boar Prime",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 72, 
            'Fire Rate' : 5.8,
            'Magazine Capacity' : 15,
            'Reload Speed' : 2.3,
            'Crit Chance' : 0.25,
            'Crit Damage' : 2.0
           }
        })),

        new (Hek = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Hek",
            masteryRank:4,
            damageType:"Impact",
            prettyDamageType:"Impact",
            damage : 140, 
            'Fire Rate' : 2.2,
            'Magazine Capacity' : 4,
            'Reload Speed' : 2.15,
            'Crit Chance' : 0.025,
            'Crit Damage' : 1.5
           }
        })),

        new (Strun = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Strun",
            masteryRank:1,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 130, 
            'Fire Rate' : 1.7,
            'Magazine Capacity' : 6,
            'Reload Speed' : 3.0,
            'Crit Chance' : 0.075,
            'Crit Damage' : 1.5
           }
        })),

        new (StrunWraith = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Strun Wraith",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 190, 
            'Fire Rate' : 2.5,
            'Magazine Capacity' : 8,
            'Reload Speed' : 1.5,
            'Crit Chance' : 0.2,
            'Crit Damage' : 1.8
           }
        })),
        
        new (Sobek = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection('sobek'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Sobek",
            masteryRank:4,
            damageType:"Impact",
            prettyDamageType:"Impact",
            damage : 100, 
            'Fire Rate' : 2.5,
            'Magazine Capacity' : 20,
            'Reload Speed' : 4.0,
            'Crit Chance' : 0.025,
            'Crit Damage' : 1.5
           }
        })),

        //
        // Sniper Rifles
        //
        new (Lanka = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"sniper", 
            name : "Lanka",
            masteryRank:7,
            damageType:"Serrated Blade",
            prettyDamageType:"Serrated Blade",
            damage : 250, 
            'Fire Rate' : 0.6666,
            'Magazine Capacity' : 10,
            'Reload Speed' : 2.0,
            'Crit Chance' : 0.20,
            'Crit Damage' : 1.5
           }
        })),

        new (Snipetron = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"sniper", 
            name : "Snipetron",
            masteryRank:0,
            damageType:"Armor Piercing",
            prettyDamageType:"Armor Piercing",
            damage : 100, 
            'Fire Rate' : 1.5,
            'Magazine Capacity' : 4,
            'Reload Speed' : 3.8,
            'Crit Chance' : 0.20,
            'Crit Damage' : 1.5
           }
        })),

        new (SnipetronVandal = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"sniper", 
            name : "Snipetron Vandal",
            masteryRank:0,
            damageType:"Armor Piercing",
            prettyDamageType:"Armor Piercing",
            damage : 125, 
            'Fire Rate' : 1.5,
            'Magazine Capacity' : 6,
            'Reload Speed' : 2.0,
            'Crit Chance' : 0.20,
            'Crit Damage' : 1.5
           }
        })),
        
        new (Vectis = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('vectis'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"sniper", 
            name : "Vectis",
            masteryRank:7,
            damageType:"Armor Piercing",
            prettyDamageType:"Armor Piercing",
            damage : 175, 
            'Fire Rate' : 1.5,
            'Magazine Capacity' : 1,
            'Reload Speed' : 1.0,
            'Crit Chance' : 0.25,
            'Crit Damage' : 2.0
           }
        })),

        new (Vulkar = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"sniper", 
            name : "Vulkar",
            masteryRank:0,
            damageType:"Bullet",
            prettyDamageType:"Bullet",
            damage : 125, 
            'Fire Rate' : 1.5,
            'Magazine Capacity' : 4,
            'Reload Speed' : 4.0,
            'Crit Chance' : 0.20,
            'Crit Damage' : 1.5
           }
        })),

        //
        // Bows
        //
        
        new (Dread = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Dread",
            masteryRank:0,
            damageType:"Blade",
            prettyDamageType:"Blade",
            damage : 60, 
            'Fire Rate' : 1.0,
            'Magazine Capacity' : 1,
            'Reload Speed' : 1.0,
            'Crit Chance' : 0.10,
            'Crit Damage' : 2.0
           }
        })),

        new (Dread = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Dread (charge)",
            masteryRank:0,
            damageType:"Blade",
            prettyDamageType:"Blade",
            damage : 150, 
            'Fire Rate' : 0.5,
            'Magazine Capacity' : 1,
            'Reload Speed' : 1.0,
            'Crit Chance' : 0.20,
            'Crit Damage' : 2.0
           }
        })),

        new (Miter = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('elemental'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Miter",
            masteryRank:4,
            damageType:"Serrated Blade",
            prettyDamageType:"Serrated Blade",
            damage : 50, 
            'Fire Rate' : 2.5,
            'Magazine Capacity' : 20,
            'Reload Speed' : 2.0,
            'Crit Chance' : 0.025,
            'Crit Damage' : 1.5
           }
        })),
        
        new (Miter = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('elemental'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Miter (charge)",
            masteryRank:4,
            damageType:"Serrated Blade",
            prettyDamageType:"Serrated Blade",
            damage : 150, 
            'Fire Rate' : 0.41666,
            'Magazine Capacity' : 20,
            'Reload Speed' : 2.0,
            'Crit Chance' : 0.0,
            'Crit Damage' : 1.0
           }
        })),

        new (Paris = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Paris",
            masteryRank:0,
            damageType:"Physics Impact",
            prettyDamageType:"Physics Impact",
            damage : 45, 
            'Fire Rate' : 1.0,
            'Magazine Capacity' : 1,
            'Reload Speed' : 1.0,
            'Crit Chance' : 0.10,
            'Crit Damage' : 1.5
           }
        })),
        
        new (Paris = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Paris (charge)",
            masteryRank:0,
            damageType:"Physics Impact",
            prettyDamageType:"Physics Impact",
            damage : 100, 
            'Fire Rate' : 0.5,
            'Magazine Capacity' : 1,
            'Reload Speed' : 1.0,
            'Crit Chance' : 0.20,
            'Crit Damage' : 1.5
           }
        })),

        new (ParisPrime = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Paris Prime",
            masteryRank:4,
            damageType:"Physics Impact",
            prettyDamageType:"Physics Impact",
            damage : 65, 
            'Fire Rate' : 1.0,
            'Magazine Capacity' : 1,
            'Reload Speed' : 1.0,
            'Crit Chance' : 0.10,
            'Crit Damage' : 1.5
           }
        })),
        
        new (ParisPrime = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Paris Prime (charge)",
            masteryRank:4,
            damageType:"Physics Impact",
            prettyDamageType:"Physics Impact",
            damage : 150, 
            'Fire Rate' : 0.5,
            'Magazine Capacity' : 1,
            'Reload Speed' : 1.0,
            'Crit Chance' : 0.20,
            'Crit Damage' : 1.5
           }
        }))
    ]);
    return this;
});
