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
           var module_types = {'Damage':0, 'Faction Damage':0, 'First Shot Damage Bonus':0, 'Piercing':0, 'Slashing':0, 'Impact':0, 'Toxic':0, 'Fire':0, 'Electrical':0, 'Freeze':0, 'Crit Chance':0, 'Crit Damage':0, 'Multishot':0, 'Fire Rate':0, 'Reload Speed':0, 'Magazine Capacity':0, 'Status Chance':0};
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
            var infested = new Enemies.AverageInfested();
            var grineer = new Enemies.AverageGrineer();
            var corpus = new Enemies.AverageCorpus();
            var corrupted = new Enemies.AverageCorrupted();
            //var damageType = this.get('damageType');
            var weaponType = this.get('weaponType');
            var projectiles = this.get('Projectiles') || 1;
            var result = {};
            result['damageBreakdown'] = {};
            result['damageBreakdown']['Piercing'] = 0;
            result['damageBreakdown']['Slashing'] = 0;
            result['damageBreakdown']['Impact'] = 0;
            result['damageBreakdown']['Toxic'] = 0;
            result['damageBreakdown']['Fire'] = 0;
            result['damageBreakdown']['Electrical'] = 0;
            result['damageBreakdown']['Freeze'] = 0;
            result['damageBreakdown']['Blast'] = 0;
            result['damageBreakdown']['Magnetic'] = 0;
            result['damageBreakdown']['Viral'] = 0;
            result['damageBreakdown']['Corrosive'] = 0;
            result['damageBreakdown']['Gas'] = 0;
            result['damageBreakdown']['Radiation'] = 0;
            
            result['moduleDamageBreakdown'] = {};
            
            var damage = 0;
            var rifleAmp = 0;
            
            //
            // Fire rate, magazine capacity, and status proc chance
            //
            
            var fireRate = this.get('Fire Rate') * (100 + module_types['Fire Rate']) / 100;
            
            //var fireRate = 1.0;
            //if (this.get('continous')){
            //    fireRate = this.get('Fire Rate');
            //} else {
            //    fireRate = this.get('Fire Rate') * (100 + module_types['Fire Rate']) / 100;
            //}

            // Note that the "'Reload Speed'" attribute is really reload time
            var reloadSpeed = this.get('Reload Speed') / ((100 + module_types['Reload Speed']) / 100);
            var magazineCapacity = Math.round(this.get('Magazine Capacity') * (100 + module_types['Magazine Capacity']) / 100);
            var statusChance = (this.get('Status Chance') * (100 + module_types['Status Chance']) / 100) / 100;
            
            // 
            // Auras 
            //

            // Rifle amp
            if((weaponType === "rifle") || (weaponType === "sniper") || (weaponType === "bow")){
                rifleAmp = this.get('auras').where({name:"Rifle Amp"})[0].getPercents()["Rifle Damage"];
            }
            // Corrosive Projection
            // Note that the calculations are handled in the enemy object, this value is just passed to the function.
            var corrosiveProjection = this.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];
            
            //
            // Base damage
            //
            
            // We loop through each element and calculate it's base damage
            for(var key in result['damageBreakdown']){
                //get base damage, or zero if it's not set
                var baseTypeDamage = this.get(key) || 0;
               
                // Add serration type mods and rifle amp
                var damageMod = (100 + module_types['Damage'] + rifleAmp) / 100;
                baseTypeDamage = baseTypeDamage * damageMod;
                
                // Add faction damage mods, bane, cleanse, expel
                var factionMod = (100 + module_types['Faction Damage']) / 100;
                baseTypeDamage = baseTypeDamage * factionMod;

                // Add charged/primed chamber if used (only sniper rifles)
                // We divide the damage bonus with the magazine capacity, if you have 1 shot in the mag you get 100% bonus, two shots 50%, etc.
                // as a way to average the bonus over serveral shots. More shots in the magazine diminishes the benefit of the mods.
                var chamberMod = (100 + module_types['First Shot Damage Bonus'] / magazineCapacity) / 100;
                baseTypeDamage = baseTypeDamage * chamberMod;
                
                //
                // Crit
                //

                var statCritChance = Math.min(this.get('Crit Chance') * (100 + module_types['Crit Chance']) / 100, 1.0);
                var statCritDamage = this.get('Crit Damage') * (100 + module_types['Crit Damage']) / 100;
                baseTypeDamage = baseTypeDamage * (1 + statCritChance * (statCritDamage - 1.0));

                result['damageBreakdown'][key] += baseTypeDamage;

                // For elemental mods we sum the base stats
                damage += baseTypeDamage;
            }
            
            //
            // Elemental type mods
            //

            // Add elemental type mods
            //var armorPiercing = damage * module_types['Armor Piercing'] / 100;
            var toxic = damage * module_types['Toxic'] / 100;
            var fire = damage * module_types['Fire'] / 100;
            var electrical = damage * module_types['Electrical'] / 100;
            var freeze = damage * module_types['Freeze'] / 100;
            result['damageBreakdown']['Toxic'] += toxic;
            result['damageBreakdown']['Fire'] += fire;
            result['damageBreakdown']['Electrical'] += electrical;
            result['damageBreakdown']['Freeze'] += freeze;
            if(toxic){
                result['moduleDamageBreakdown']['Toxic'] = toxic;
            }
            if(fire){
                result['moduleDamageBreakdown']['Fire'] = fire;
            }
            if(electrical){
                result['moduleDamageBreakdown']['Electrical'] = electrical;
            }
            if(freeze){
                result['moduleDamageBreakdown']['Freeze'] = freeze;
            }
            
            //
            // Other damage
            //

            // The special damage is the weapon's extra custom damage function
            // eg. Acrid's 50% extra damage toxic dot
            
            var specialDamage = this.specialDamageCalculations(result['damageBreakdown'], module_types);
            for(var key in specialDamage){
                if(!result['damageBreakdown'][key]){result['damageBreakdown'][key] = 0;}
                if(key !== 'DoT'){
                    result['damageBreakdown'][key] += specialDamage[key];
                } else {
                    for(var specialKey in specialDamage['DoT']['damageBreakdown']){
                        // Arbitrary choice of two seconds of dot damage
                        result['damageBreakdown'][specialKey + ' (DoT)'] = (specialDamage['DoT']['damageBreakdown'][specialKey] / specialDamage['DoT']['ticks']) * specialDamage['DoT']['ticksPerSecond'] * 2;
                    }
                }
            };
            
            // Add base damage specific Piercing/Rupture/etc. 
            // Note that these do not affect elemental damage
            
            result['damageBreakdown']['Impact'] *= (100 + module_types['Impact']) / 100;
            result['damageBreakdown']['Slashing'] *= (100 + module_types['Slashing']) / 100;
            
            // Accelerated Blast is bugged, it acts an elemental mod, to simulate this it has "Elemental Piercing"
            if(module_types['Elemental Piercing']){
                var basePierce = result['damageBreakdown']['Piercing'];
                result['damageBreakdown']['Piercing'] += damage * module_types['Elemental Piercing'] / 100;
                result['damageBreakdown']['Piercing'] += basePierce * module_types['Piercing'] / 100;
            } else {
                result['damageBreakdown']['Piercing'] *=(100 + module_types['Piercing']) / 100;
            }
            
            
            var totalDamage = 0;
            result['dpsBreakdown'] = {};
            result['burstBreakdown'] = {};
            var multishotDamage = 0.0;
            projectiles *= 1 + module_types['Multishot'] / 100;
            for (var key in result['damageBreakdown']){
                // Add multishot
                multishotDamage += result['damageBreakdown'][key] * module_types['Multishot'] / 100;
                result['damageBreakdown'][key] = result['damageBreakdown'][key] + (result['damageBreakdown'][key] * module_types['Multishot'] / 100);
                
                // Calculate individual element DPS
                result['dpsBreakdown'][key] = (result['damageBreakdown'][key] * magazineCapacity) / (magazineCapacity / fireRate + reloadSpeed);
                result['burstBreakdown'][key] = result['damageBreakdown'][key] * fireRate;

                totalDamage += result['damageBreakdown'][key];
            }
            
            //
            // Sums and DPS
            //
            
            var dps = (totalDamage * magazineCapacity) / (magazineCapacity / fireRate + reloadSpeed);
            var burst = totalDamage * fireRate;
            
            //
            // Sentinel calculations
            //
            // Sentinels aren't affected by reload or magazine size mods
            //if(weaponType === "sentinel"){
            //    dps = totalDamage * fireRate;
            //}
            
            // Note to self: remember to add new results just below this in the updateModuleDps function, 
            // in the sorting, and add it in the weapon.js view thing too.
            result['dps'] = dps;
            result['shot'] = totalDamage;
            result['burst'] = burst;
            result['procs'] = statusChance * projectiles;
            //result['baseDamage'] = baseDamage;
            //result['criticalDamage'] = criticalDamage;
            result['multishotDamage'] = multishotDamage;
            result['Fire Rate'] = fireRate;
            result['Reload Speed'] = reloadSpeed;
            result['Magazine Capacity'] = magazineCapacity;
            result['Crit Chance'] = statCritChance;
            result['Crit Damage'] = statCritDamage;
            result['Multishot'] = module_types['Multishot'];
            
            result['specialDamage'] = specialDamage;
            
            result['factionMod'] = factionMod;
            
            result['baseDamageStats'] = {};
            result['baseDamageStats']['Impact'] = this.get('Impact') || 0;
            result['baseDamageStats']['Piercing'] = this.get('Piercing')|| 0;
            result['baseDamageStats']['Slashing'] = this.get('Slashing')|| 0;
            result['baseDamageStats']['Toxic'] = this.get('Toxic')|| 0;
            result['baseDamageStats']['Fire'] = this.get('Fire')|| 0;
            result['baseDamageStats']['Electrical'] = this.get('Electrical')|| 0;
            result['baseDamageStats']['Freeze'] = this.get('Freeze')|| 0;
            result['baseDamageStats']['Blast'] = this.get('Blast')|| 0;
            result['baseDamageStats']['Magnetic'] = this.get('Magnetic')|| 0;
            result['baseDamageStats']['Viral'] = this.get('Viral')|| 0;
            result['baseDamageStats']['Corrosive'] = this.get('Corrosive')|| 0;
            result['baseDamageStats']['Gas'] = this.get('Gas')|| 0;
            result['baseDamageStats']['Radiation'] = this.get('Radiation')|| 0;
            
            result['baseDamageType'] = "";
            if(result['baseDamageStats']['Toxic'] > 0){
                result['baseDamageType'] = 'Toxic';
            }
            if(result['baseDamageStats']['Fire'] > 0){
                result['baseDamageType'] = 'Fire';
            }
            if(result['baseDamageStats']['Electrical'] > 0){
                result['baseDamageType'] = 'Electrical';
            }
            if(result['baseDamageStats']['Freeze'] > 0){
                result['baseDamageType'] = 'Freeze';
            }
            
            result['stats'] = {};
            result['stats']['Fire Rate'] = fireRate;
            result['stats']['Reload Speed'] = reloadSpeed;
            result['stats']['Magazine Capacity'] = magazineCapacity;
            result['stats']['Crit Chance'] = statCritChance;
            result['stats']['Crit Damage'] = statCritDamage;
            result['stats']['Status Chance'] = statusChance;
            // stat_name += " (" + ((1 - Math.pow((1 - stat_value), proc_chances)) * 100).toFixed(1) + "%)";
            result['stats']['Status Probability'] = (1 - Math.pow((1 - statusChance), projectiles)) * 100;
            result['stats']['Avg. Procs/Shot'] = statusChance * projectiles;
            result['stats']['Projectiles'] = projectiles;
            result['stats']['Time Firing'] = (magazineCapacity / fireRate)/((magazineCapacity / fireRate) + reloadSpeed);
            
            //result['ancientDps'] = infestedAncient.getDamageTaken(result, 25, corrosiveProjection);
            //result['napalmDps'] = grineerNapalm.getDamageTaken(result, 25, corrosiveProjection);
            //result['techDps'] = corpusTech.getDamageTaken(result, 25, corrosiveProjection);
            //result['moaDps'] = corpusMoa.getDamageTaken(result, 25, corrosiveProjection);
            result['infestedDps'] = infested.getDamageTaken(result, 25, corrosiveProjection);
            result['grineerDps'] = grineer.getDamageTaken(result, 25, corrosiveProjection);
            result['corpusDps'] = corpus.getDamageTaken(result, 25, corrosiveProjection);
            result['corruptedDps'] = corrupted.getDamageTaken(result, 25, corrosiveProjection);
            var apDps = 0; //new Enemies.AncientDisruptor().getDamageTaken(result, 200, corrosiveProjection);
            result['apdps'] = apDps;
            
//            result['ancient'] = infestedAncient;
//            result['napalm'] = grineerNapalm;
//            result['tech'] = corpusTech;
//            result['moa'] = corpusMoa;
            result['infested'] = infested;
            result['grineer'] = grineer;
            result['corpus'] = corpus;
            result['corrupted'] = corrupted;
            
            return result;
        },
        updateModuleDps:function(){
            
            // Used after updating module stats (and weapon init) to re-calculate how much
            // one mod level gives in DPS
            var weapon = this;
            var modPercentages = this.getCalculatedModPercentages();
            var enemy = new Enemies.Enemy();
            var weaponResult = weapon.getDps(modPercentages, enemy);
            var infestedMaxDps = 0;
            var grineerMaxDps = 0;
            var corpusMaxDps = 0;
            var corruptedMaxDps = 0;
            
            // Set max DPS
            for(var key in weaponResult.infestedDps){
                if(infestedMaxDps < weaponResult.infestedDps[key]['DPS']){
                    infestedMaxDps = weaponResult.infestedDps[key]['DPS'];
                }
                if(grineerMaxDps < weaponResult.grineerDps[key]['DPS']){
                    grineerMaxDps = weaponResult.grineerDps[key]['DPS'];
                }
                if(corpusMaxDps < weaponResult.corpusDps[key]['DPS']){
                    corpusMaxDps = weaponResult.corpusDps[key]['DPS'];
                }
                if(corruptedMaxDps < weaponResult.corruptedDps[key]['DPS']){
                    corruptedMaxDps = weaponResult.corruptedDps[key]['DPS'];
                }
            }
            
            this.set('result', weaponResult);
            this.set('dps', weaponResult.dps);
            this.set('apdps', weaponResult.apdps);
            this.set('burst', weaponResult.burst);
            this.set('shot', weaponResult.shot);
            this.set('procs', weaponResult.procs);
            this.set('infested', infestedMaxDps);
            this.set('grineer', grineerMaxDps);
            this.set('corpus', corpusMaxDps);
            this.set('corrupted', corruptedMaxDps);
            this.set('void', corruptedMaxDps);
            this.set('infestedAltsDps', weaponResult.infestedDps);
            this.set('grineerAltsDps', weaponResult.grineerDps);
            this.set('corpusAltsDps', weaponResult.corpusDps);
            this.set('corruptedAltsDps', weaponResult.corruptedDps);
            
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
            this.sort_asc['dps'] = false;
            this.sort_asc['shot'] = false;
            this.sort_asc['procs'] = false;
            this.sort_asc['infested'] = false;
            this.sort_asc['grineer'] = false;
            this.sort_asc['corpus'] = false;
            this.sort_asc['void'] = false;
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
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"pistol", 
             name : "Acrid",
             masteryRank:7,
             'Toxic': 20,
             'Status Chance':10,
             'Fire Rate' : 6.67,
             'Magazine Capacity' : 15, 
             'Reload Speed' : 1.2, 
             'Crit Chance' : 0.025, 
             'Crit Damage' : 1.5  
           },
            specialDamageCalculations:function(damageBreakdown, module_types){
                var statCritChance = Math.min(this.get('Crit Chance') * (100 + module_types['Crit Chance']) / 100, 1.0);
                var statCritDamage = this.get('Crit Damage') * (100 + module_types['Crit Damage']) / 100;

                var baseDamage = this.get('Toxic') * (100 + module_types['Damage']) / 100;
                baseDamage = baseDamage * (100 + module_types['Faction Damage']) / 100;
                baseDamage += baseDamage * statCritChance * (statCritDamage - 1.0);
                
                var damage = {};
                damage['DoT'] = {};
                damage['DoT']['damageBreakdown'] = {};
                // 50% base damage per tick for 9 ticks
                damage['DoT']['damageBreakdown']['Toxic'] =  baseDamage * 0.5 * 9;
                damage['DoT']['ticks'] = 9;
                damage['DoT']['ticksPerSecond'] = 1;
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
            'Impact':2.3,
            'Piercing':10.5,
            'Slashing':2.2,
            'Status Chance':1,
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
            'Impact':4.5,
            'Piercing':40.5,
            'Slashing':0,
            'Status Chance':7.5,
            'Fire Rate' : 10, 
            'Magazine Capacity' : 30, 
            'Reload Speed' : 2.6, 
            'Crit Chance' : 0.05,
            'Crit Damage' : 2.0  
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
            'Impact':3.6,
            'Piercing':6.0,
            'Slashing':14.4,
            'Status Chance':1,
            'Fire Rate' : 8.33, 
            'Magazine Capacity' : 30, 
            'Reload Speed' : 2.4, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
           }
        })),
        
        new (Aklex = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Aklex",
            masteryRank:0,
            'Impact':7,
            'Piercing':56,
            'Slashing':7,
            'Status Chance':15,
            'Fire Rate' : 2, 
            'Magazine Capacity' : 12, 
            'Reload Speed' : 3, 
            'Crit Chance' : 0.20, 
            'Crit Damage' : 2.0  
           }
        })),
        
        new (Akmagnus = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewPistolModCollection('akmagnus'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Akmagnus",
            masteryRank:0,
            'Impact':20.25,
            'Piercing':12.375,
            'Slashing':12.375,
            'Status Chance':25,
            'Fire Rate' : 8.33,
            'Magazine Capacity' : 16, 
            'Reload Speed' : 3.0, 
            'Crit Chance' : 0.25,
            'Crit Damage' : 2.0  
           }
        })),
        
        new (Ballistica = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Ballistica (burst)",
            masteryRank:0,
            'Impact':6.25,
            'Piercing':12.5,
            'Slashing':6.25,
            'Status Chance':2.5,
            'Fire Rate' : 3.3, 
            'Magazine Capacity' : 16, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
           }
        })),
        
        new (BallisticaCharge = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Ballistica (charge)",
            masteryRank:0,
            'Impact':25,
            'Piercing':50,
            'Slashing':25,
            'Status Chance':2.5,
            'Fire Rate' : 0.769, // (1 / 1.3), 1 sec charge, + 0.3 sec (1/3.3  = 0.3) between shots
            'Magazine Capacity' : 16, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.15, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Bolto = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Bolto",
            masteryRank:0,
            'Impact':4.5,
            'Piercing':40.5,
            'Slashing':0,
            'Status Chance':7.5, 
            'Fire Rate' : 6.83, 
            'Magazine Capacity' : 15, 
            'Reload Speed' : 2.3, 
            'Crit Chance' : 0.05,
            'Crit Damage' : 2.0  
           }
        })),
        
        new (Brakk = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Brakk",
            masteryRank:0,
            Projectiles:10,
            'Impact':67.5,
            'Piercing':37.5,
            'Slashing':45,
            'Status Chance':10,
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
             this.set('modules', Modules.getNewPistolModCollection('bronco'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Bronco",
            masteryRank:0,
            Projectiles:7,
            'Impact':84,
            'Piercing':10.5,
            'Slashing':10.5,
            'Status Chance':2,
            'Fire Rate' : 5.0, 
            'Magazine Capacity' : 2, 
            'Reload Speed' : 1.05, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 2.0  
           }
        })),

        new (BroncoPrime = Weapon.extend({
           initialize:function(){
             //console.log("Bronco Prime init!");
             this.set('modules', Modules.getNewPistolModCollection('bronco'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Bronco Prime",
            masteryRank:0,
            Projectiles:7,
            'Impact':112,
            'Piercing':14,
            'Slashing':14,
            'Status Chance':2.5,
            'Fire Rate' : 4.2, 
            'Magazine Capacity' : 4, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
           }
        })),
        
        new (Cestra = Weapon.extend({
           initialize:function(){
             //console.log("Despair init!");
             this.set('modules', Modules.getNewPistolModCollection('cestra'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Cestra",
            masteryRank:0,
            damageType:"Armor Piercing",
            prettyDamageType:"Armor Piercing",
            'Impact':5,
            'Piercing':20,
            'Slashing':0,
            'Status Chance':5, 
            'Fire Rate' : 8.3, 
            'Magazine Capacity' : 60, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.1, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Despair = Weapon.extend({
           initialize:function(){
             //console.log("Despair init!");
             this.set('modules', Modules.getNewPistolModCollection('cestra'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Despair",
            masteryRank:0,
            'Impact':2.8,
            'Piercing':44,
            'Slashing':8.2,
            'Status Chance':2.5, 
            'Fire Rate' : 3.3, 
            'Magazine Capacity' : 10, 
            'Reload Speed' : 0.75, 
            'Crit Chance' : 0.05, 
            'Crit Damage' : 1.5  
           }
        })),
        
        new (Detron = Weapon.extend({
           initialize:function(){
             //console.log("Despair init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Detron",
            masteryRank:0,
            Projectiles:7,
            'Radiation':105,
            'Status Chance':10, 
            'Fire Rate' : 3.3, 
            'Magazine Capacity' : 5, 
            'Reload Speed' : 1.0, 
            'Crit Chance' : 0.1, 
            'Crit Damage' : 1.5  
           }
        })),

        new (DualBroncos = Weapon.extend({
           initialize:function(){
             //console.log("Dual Broncos init!");
             this.set('modules', Modules.getNewPistolModCollection('bronco'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Dual Broncos",
            masteryRank:0,
            Projectiles:7,
            'Impact':84,
            'Piercing':10.5,
            'Slashing':10.5,
            'Status Chance':2.0, 
            'Fire Rate' : 8.3, 
            'Magazine Capacity' : 4, 
            'Reload Speed' : 2.2, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 2.0  
           }
        })),

        new (Akvasto = Weapon.extend({
           initialize:function(){
             //console.log("Dual Vastos init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Akvasto",
            masteryRank:0,
            'Impact':12.5,
            'Piercing':12.5,
            'Slashing':25,
            'Status Chance':5,
            'Fire Rate' : 10, 
            'Magazine Capacity' : 12, 
            'Reload Speed' : 1.75, 
            'Crit Chance' : 0.15, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Embolist = Weapon.extend({
           initialize:function(){
             //console.log("Embolist init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            continous:true,
            weaponType:"pistol", 
            name : "Embolist",
            masteryRank:8,
            'Toxic':15,
            'Status Chance':10,
            'Fire Rate' : 10,
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
            'Impact':2.25,
            'Piercing':10.5,
            'Slashing':2.25,
            'Status Chance':1,
            'Fire Rate' : 10,
            'Magazine Capacity' : 35, 
            'Reload Speed' : 1.4, 
            'Crit Chance' : 0.05, 
            'Crit Damage' : 2.0  
           }
        })),

        new (Hikou = Weapon.extend({
           initialize:function(){
             //console.log("Furis init!");
             this.set('modules', Modules.getNewPistolModCollection('cestra'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Hikou",
            masteryRank:2,
            'Impact':2.5,
            'Piercing':15,
            'Slashing':7.5,
            'Status Chance':2.5,
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
            'Impact':33.8,
            'Piercing':5.6,
            'Slashing':5.6,
            'Status Chance':10,
            'Fire Rate' : 2.8,
            'Magazine Capacity' : 14, 
            'Reload Speed' : 2.4, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 2.0  
           }
        })),

        new (Kunai = Weapon.extend({
           initialize:function(){
             //console.log("Kraken init!");
             this.set('modules', Modules.getNewPistolModCollection('cestra'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Kunai",
            masteryRank:2,
            'Impact':4.5,
            'Piercing':33.8,
            'Slashing':6.7,
            'Status Chance':2.5,
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
            'Impact':1.8,
            'Piercing':3,
            'Slashing':7.2,
            'Status Chance':1,
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
            'Impact':2.2,
            'Piercing':4.4,
            'Slashing':15.4,
            'Status Chance':5,
            'Fire Rate' : 6.7,
            'Magazine Capacity' : 15, 
            'Reload Speed' : 1.2, 
            'Crit Chance' : 0.05, 
            'Crit Damage' : 2.0  
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
            'Impact':3,
            'Piercing':5,
            'Slashing':12,
            'Status Chance':5,
            'Fire Rate' : 5.0,
            'Magazine Capacity' : 15, 
            'Reload Speed' : 1.2, 
            'Crit Chance' : 0.075, 
            'Crit Damage' : 2.0  
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
            'Impact':7,
            'Piercing':56,
            'Slashing':7,
            'Status Chance':10,
            'Fire Rate' : 1.1,
            'Magazine Capacity' : 6, 
            'Reload Speed' : 2.35, 
            'Crit Chance' : 0.15, 
            'Crit Damage' : 2.0  
           }
        })),
        
        new (Magnus = Weapon.extend({
           initialize:function(){
             //console.log("Lex init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Magnus",
            masteryRank:0,
            'Impact':20.25,
            'Piercing':12.375,
            'Slashing':12.375,
            'Status Chance':20,
            'Fire Rate' : 5.8,
            'Magazine Capacity' : 8, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.2, 
            'Crit Damage' : 2.0  
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
            'Impact':28.3,
            'Piercing':28.3,
            'Slashing':28.3,
            'Status Chance':10,
            'Fire Rate' : 2.0,
            'Magazine Capacity' : 8, 
            'Reload Speed' : 3.0, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5  
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
            'Impact':21,
            'Piercing':4.5,
            'Slashing':4.5,
            'Status Chance':2.5,
            'Fire Rate' : 3.5,
            'Magazine Capacity' : 15, 
            'Reload Speed' : 1.9, 
            'Crit Chance' : 0.10, 
            'Crit Damage' : 2.0  
           }
        })),
        
        new (SicarusPrime = Weapon.extend({
           initialize:function(){
             //console.log("Sicarus init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Sicarus Prime",
            masteryRank:1,
            'Impact':12.8,
            'Piercing':9.6,
            'Slashing':9.6,
            'Status Chance':10,
            'Fire Rate' : 5.0,
            'Magazine Capacity' : 20, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.10, 
            'Crit Damage' : 1.5  
           }
        })),

        new (Spectra = Weapon.extend({
           initialize:function(){
             //console.log("Spectra init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            continous:true,
            weaponType:"pistol", 
            name : "Spectra",
            masteryRank:4,
            'Impact':0.8,
            'Piercing':5.6,
            'Slashing':1.6,
            'Status Chance':2,
            'Fire Rate' : 10.0,
            'Magazine Capacity' : 50, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.05, 
            'Crit Damage' : 2.0  
           }
        })),
        
        new (Stug = Weapon.extend({
           initialize:function(){
             //console.log("Spectra init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Stug",
            masteryRank:0,
            'Corrosive':75,
            'Status Chance':2,
            'Fire Rate' : 6.67,
            'Magazine Capacity' : 20,
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.0, 
            'Crit Damage' : 2.0  
           },
           specialDamageCalculations:function(damageBreakdown, module_types){
                var baseDamage = this.get('Corrosive') * (100 + module_types['Damage']) / 100;
                baseDamage = baseDamage * (100 + module_types['Faction Damage']) / 100;
                
                var damage = {};
                damage['DoT'] = {};
                damage['DoT']['damageBreakdown'] = {};
                // 6% base damage per tick for 2 ticks
                damage['DoT']['damageBreakdown']['Corrosive'] =  baseDamage * 0.06 * 2;
                damage['DoT']['ticks'] = 2;
                damage['DoT']['ticksPerSecond'] = 1;
                return damage;
            }
        })),
        
        new (StugCharge = Weapon.extend({
           initialize:function(){
             //console.log("Spectra init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Stug (charge)",
            masteryRank:0,
            'Corrosive':450,
            'Status Chance':2,
            'Fire Rate' : 0.33,
            'Magazine Capacity' : 2,
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.0, 
            'Crit Damage' : 2.0  
           },
           specialDamageCalculations:function(damageBreakdown, module_types){
                var baseDamage = this.get('Corrosive') * (100 + module_types['Damage']) / 100;
                baseDamage = baseDamage * (100 + module_types['Faction Damage']) / 100;
                
                var damage = {};
                damage['DoT'] = {};
                damage['DoT']['damageBreakdown'] = {};
                // 6% base damage per tick for 2 ticks
                damage['DoT']['damageBreakdown']['Corrosive'] =  baseDamage * 0.06 * 2;
                damage['DoT']['ticks'] = 2;
                damage['DoT']['ticksPerSecond'] = 1;
                return damage;
            }
        })),

        new (TwinGremlins = Weapon.extend({
           initialize:function(){
             //console.log("Twin Gremlins init!");
             this.set('modules', Modules.getNewPistolModCollection('cestra'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Twin Gremlins",
            masteryRank:0,
            'Impact':10,
            'Piercing':10,
            'Slashing':10,
            'Status Chance':10,
            'Fire Rate' : 5.0,
            'Magazine Capacity' : 30, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 2.0  
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
            'Impact':9.6,
            'Piercing':1.6,
            'Slashing':4.8,
            'Status Chance':1,
            'Fire Rate' : 25.0,
            'Magazine Capacity' : 28, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.15, 
            'Crit Damage' : 1.5  
           }
        })),
        
        new (Tysis = Weapon.extend({
           initialize:function(){
             //console.log("Twin Vipers init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Tysis",
            masteryRank:4,
            'Corrosive':35.0,
            'Status Chance':50,
            'Fire Rate' : 2.5,
            'Magazine Capacity' : 15, 
            'Reload Speed' : 1.2, 
            'Crit Chance' : 0.025, 
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
            'Impact':12.5,
            'Piercing':12.5,
            'Slashing':25,
            'Status Chance':5,
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
            'Impact':9.6,
            'Piercing':1.6,
            'Slashing':4.8,
            'Status Chance':1,
            'Fire Rate' : 14.4,
            'Magazine Capacity' : 14, 
            'Reload Speed' : 1.1, 
            'Crit Chance' : 0.15, 
            'Crit Damage' : 1.5  
           }
        })),
        
        new (WraithTwinVipers = Weapon.extend({
           initialize:function(){
             //console.log("Twin Vipers init!");
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"pistol", 
            name : "Wraith Twin Vipers",
            masteryRank:0,
            'Impact':14.4,
            'Piercing':1.8,
            'Slashing':1.8,
            'Status Chance':5,
            'Fire Rate' : 25.0,
            'Magazine Capacity' : 40, 
            'Reload Speed' : 2.0, 
            'Crit Chance' : 0.18, 
            'Crit Damage' : 2.0  
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
             'Impact':2.5,
             'Piercing':20,
             'Slashing':2.5,
             'Status Chance':10,
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
             'Impact':6.6,
             'Piercing':6.6,
             'Slashing':6.8,
             'Status Chance':5, 
             'Fire Rate' : 8.8, 
             'Magazine Capacity' : 45, 
             'Reload Speed' : 2.37, 
             'Crit Chance' : 0.1, 
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
             'Impact':1.25,
             'Piercing':8.75,
             'Slashing':15,
             'Status Chance':10, 
             'Fire Rate' : 8.8, 
             'Magazine Capacity' : 50, 
             'Reload Speed' : 2.2, 
             'Crit Chance' : 0.1, 
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
             'Impact':8.75,
             'Piercing':1.25,
             'Slashing':15,
             'Status Chance':10, 
             'Fire Rate' : 7.9, 
             'Magazine Capacity' : 45, 
             'Reload Speed' : 1.9, 
             'Crit Chance' : 0.1, 
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
             'Impact':10,
             'Piercing':10,
             'Slashing':10,
             'Status Chance':10, 
             'Fire Rate' : 5.0, 
             'Magazine Capacity' : 45, 
             'Reload Speed' : 1.9, 
             'Crit Chance' : 0.05, 
             'Crit Damage' : 1.5  
           }
        })),
        
        new (BurstonPrime = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Burston Prime",
             masteryRank:0,
             'Impact':11.7,
             'Piercing':11.7,
             'Slashing':15.6,
             'Status Chance':15, 
             'Fire Rate' : 10.0, 
             'Magazine Capacity' : 45, 
             'Reload Speed' : 2, 
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
             'Impact':4.4,
             'Piercing':16.5,
             'Slashing':1.1,
             'Status Chance':10,
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
             'Impact':1.5,
             'Piercing':1.5,
             'Slashing':12,
             'Status Chance':9,
             'Fire Rate' : 10, 
             'Magazine Capacity' : 100, 
             'Reload Speed' : 2.0, 
             'Crit Chance' : 0.05, 
             'Crit Damage' : 2.0  
           }
        })),

        new (Gorgon = Weapon.extend({
           initialize:function(){
             //console.log("Gorgon init!");
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"rifle", 
            name : "Gorgon",
            masteryRank:3,
            'Impact':18.75,
            'Piercing':3.75,
            'Slashing':2.5,
            'Status Chance':5,
            'Fire Rate' : 12.5,
            'Magazine Capacity' : 90, 
            'Reload Speed' : 4.2, 
            'Crit Chance' : 0.1, 
            'Crit Damage' : 1.5
           }
        })),

        new (Grakata = Weapon.extend({
           initialize:function(){
             //console.log("Grakata init!");
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"rifle", 
            name : "Grakata",
            masteryRank:0,
            'Impact':4.4,
            'Piercing':3.7,
            'Slashing':2.9,
            'Status Chance':20,
            'Fire Rate' : 20, 
            'Magazine Capacity' : 60, 
            'Reload Speed' : 2.37, 
            'Crit Chance' : 0.25, 
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
             'Impact':10,
             'Piercing':10,
             'Slashing':10,
             'Status Chance':10,
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
             'Fire':10,
             'Status Chance':1,
             'Fire Rate' : 10, 
             'Magazine Capacity' : 100, 
             'Reload Speed' : 2.0, 
             'Crit Chance' : 0.05, 
             'Crit Damage' : 2.0  
           }
        })),
        
        new (Karak = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Karak",
             masteryRank:0,
             'Impact':12,
             'Piercing':8,
             'Slashing':6,
             'Status Chance':7.5, 
             'Fire Rate' : 11.7, 
             'Magazine Capacity' : 30, 
             'Reload Speed' : 2.0, 
             'Crit Chance' : 0.025, 
             'Crit Damage' : 1.5  
           }
        })),

        new (Latron = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Latron",
             masteryRank:0,
             'Impact':6,
             'Piercing':28,
             'Slashing':6,
             'Status Chance':10, 
             'Fire Rate' : 4.2, 
             'Magazine Capacity' : 15, 
             'Reload Speed' : 2.4, 
             'Crit Chance' : 0.1, 
             'Crit Damage' : 2.0  
           }
        })),

        new (LatronPrime = Weapon.extend({
           initialize:function(){
             //console.log("Latron Prime init!");
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
             weaponType:"rifle", 
             name : "Latron Prime",
             masteryRank:0,
             'Impact':4.5,
             'Piercing':36,
             'Slashing':4.5,
             'Status Chance':15,
             'Fire Rate' : 4.17, 
             'Magazine Capacity' : 15, 
             'Reload Speed' : 2.4, 
             'Crit Chance' : 0.15, 
             'Crit Damage' : 2.5  
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
             'Impact':2.55,
             'Piercing':4.25,
             'Slashing':10.2,
             'Status Chance':1,
             'Fire Rate' : 5.8, 
             'Magazine Capacity' : 60, 
             'Reload Speed' : 2.0, 
             'Crit Chance' : 0.05, 
             'Crit Damage' : 1.5  
           }
        })),

        new (Ogris = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"rifle", 
            name : "Ogris",
            masteryRank:6,
            'Blast':150,
            'Status Chance':10,
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
               damage['Toxic'] = baseExplosionDamage * (module_types['Toxic'] / 100);
               damage['Fire'] = baseExplosionDamage * (module_types['Fire'] / 100);
               damage['Freeze'] = baseExplosionDamage * (module_types['Freeze'] / 100);
               damage['Electrical'] = baseExplosionDamage * (module_types['Electrical'] / 100);

               damage['Blast'] = baseExplosionDamage; 
               return damage;
            }
        })),
        
        new (Penta = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"rifle", 
            name : "Penta",
            masteryRank:0,
            'Impact':75,
            'Status Chance':10,
            explosionDamage: 350,
            'Fire Rate' : 1.0,
            'Magazine Capacity' : 5, 
            'Reload Speed' : 2.5, 
            'Crit Chance' : 0.05, 
            'Crit Damage' : 2.0
           },
           specialDamageCalculations:function(damageBreakdown, module_types){
               var baseExplosionDamage = this.get('explosionDamage') * (100 + module_types['Damage']) / 100;
               baseExplosionDamage = baseExplosionDamage * (100 + module_types['Faction Damage']) / 100;
               var damage = {};
               damage['Toxic'] = baseExplosionDamage * (module_types['Toxic'] / 100);
               damage['Fire'] = baseExplosionDamage * (module_types['Fire'] / 100);
               damage['Freeze'] = baseExplosionDamage * (module_types['Freeze'] / 100);
               damage['Electrical'] = baseExplosionDamage * (module_types['Electrical'] / 100);
               damage["Blast"] = baseExplosionDamage; 
               return damage;
            }
        })),

        new (Soma = Weapon.extend({
           initialize:function(){
             //console.log("Soma init!");
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"rifle", 
            name : "Soma",
            masteryRank:6,
            'Impact':1,
            'Piercing':4,
            'Slashing':5,
            'Status Chance':7,
            'Fire Rate' : 15, 
            'Magazine Capacity' : 100, 
            'Reload Speed' : 3.0, 
            'Crit Chance' : 0.30, 
            'Crit Damage' : 3.0
           }
        })),

        new (Supra = Weapon.extend({
           initialize:function(){
             //console.log("Supra init!");
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"rifle", 
            name : "Supra",
            masteryRank:7,
            'Impact':3.5,
            'Piercing':26.3,
            'Slashing':5.2,
            'Status Chance':2.5, 
            'Fire Rate' : 12.5,
            'Magazine Capacity' : 90, 
            'Reload Speed' : 4.2, 
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5
           }
        })),

        new (Synapse = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('synapse'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            continous:true,
            weaponType:"rifle", 
            name : "Synapse",
            masteryRank:6,
            'Electrical':12.5,
            'Status Chance':10,
            'Fire Rate' : 10,
            'Magazine Capacity' : 100, 
            'Reload Speed' : 1.5,
            'Crit Chance' : 0.5, 
            'Crit Damage' : 2.0
           }
        })),
        
        new (Tetra = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            continous:true,
            weaponType:"rifle", 
            name : "Tetra",
            masteryRank:0,
            'Impact':6,
            'Piercing':24,
            'Status Chance':10,
            'Fire Rate' : 6.67,
            'Magazine Capacity' : 60, 
            'Reload Speed' : 2.0,
            'Crit Chance' : 0.025, 
            'Crit Damage' : 1.5
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
             'Toxic':100,
             'Status Chance':10,
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
               for (var key in damageBreakdown){
                    if(module_types[key]){
                        damage[key] = baseDotDamage * module_types[key] / 100;
                    }
               }
               if(!damage['Toxic']) {damage['Toxic'] = 0;};
               damage['Toxic'] += baseDotDamage;
               return damage;
            }
        })),

        //
        // Shotguns
        //
        new (Boar = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Boar",
            masteryRank:2,
            Projectiles:6,
            'Impact':52.8,
            'Piercing':14.4,
            'Slashing':28.8,
            'Status Chance':2.5,
            'Fire Rate' : 5,
            'Magazine Capacity' : 10,
            'Reload Speed' : 2.3,
            'Crit Chance' : 0.05,
            'Crit Damage' : 1.5
           }
        })),

        new (BoarPrime = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection('sobek'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Boar Prime",
            masteryRank:0,
            Projectiles:9,
            'Impact':76,
            'Piercing':17.6,
            'Slashing':23.4,
            'Status Chance':5, 
            'Fire Rate' : 5.8,
            'Magazine Capacity' : 15,
            'Reload Speed' : 2.3,
            'Crit Chance' : 0.15,
            'Crit Damage' : 2.0
           }
        })),
        
        new (Drakgoon = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Drakgoon",
            Projectiles:10,
            masteryRank:0,
            'Impact':30,
            'Piercing':30,
            'Slashing':90,
            'Status Chance':10,
            'Fire Rate' : 3.33,
            'Magazine Capacity' : 7,
            'Reload Speed' : 2.3,
            'Crit Chance' : 0.05,
            'Crit Damage' : 2.0
           }
        })),
        
        new (DrakgoonCharge = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Drakgoon (charge)",
            Projectiles:10,
            masteryRank:0,
            'Impact':25,
            'Piercing':25,
            'Slashing':200,
            'Status Chance':10,
            'Fire Rate' : 0.8,
            'Magazine Capacity' : 7,
            'Reload Speed' : 2.3,
            'Crit Chance' : 0.075,
            'Crit Damage' : 2.0
           }
        })),

        new (Hek = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Hek",
            Projectiles:7,
            masteryRank:4,
            'Impact':21,
            'Piercing':91,
            'Slashing':28,
            'Status Chance':15,
            'Fire Rate' : 2.2,
            'Magazine Capacity' : 4,
            'Reload Speed' : 2.2,
            'Crit Chance' : 0.1,
            'Crit Damage' : 2.0
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
            Projectiles:4,
            'Impact':90,
            'Piercing':15,
            'Slashing':15,
            'Status Chance':15,
            'Fire Rate' : 2.5,
            'Magazine Capacity' : 20,
            'Reload Speed' : 4.0,
            'Crit Chance' : 0.10,
            'Crit Damage' : 2.0
           }
        })),

        new (Strun = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Strun",
            masteryRank:1,
            Projectiles:10,
            'Impact':66,
            'Piercing':18,
            'Slashing':36,
            'Status Chance':2.5,
            'Fire Rate' : 1.7,
            'Magazine Capacity' : 6,
            'Reload Speed' : 3.0,
            'Crit Chance' : 0.075,
            'Crit Damage' : 1.5
           }
        })),

        new (StrunWraith = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection('sobek'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Strun Wraith",
            masteryRank:0,
            Projectiles:8,
            'Impact':97.5,
            'Piercing':22.5,
            'Slashing':30,
            'Status Chance':5, 
            'Fire Rate' : 2.5,
            'Magazine Capacity' : 8,
            'Reload Speed' : 1.5,
            'Crit Chance' : 0.15,
            'Crit Damage' : 2.0
           }
        })),
        
        new (Tigris = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection('tigris'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"shotgun", 
            name : "Tigris",
            masteryRank:0,
            Projectiles:4,
            'Impact':18,
            'Piercing':18,
            'Slashing':144,
            'Status Chance':15,
            'Fire Rate' : 2.3,
            'Magazine Capacity' : 2,
            'Reload Speed' : 1.8,
            'Crit Chance' : 0.025,
            'Crit Damage' : 1.5
           }
        })),

        //
        // Sniper Rifles
        //
        new (Lanka = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewSniperModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"sniper", 
            name : "Lanka",
            masteryRank:7,
            'Electrical':250,
            'Status Chance':25,
            'Fire Rate' : 0.4615,
            'Magazine Capacity' : 10,
            'Reload Speed' : 2.0,
            'Crit Chance' : 0.20,
            'Crit Damage' : 1.5
           }
        })),

        new (Snipetron = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewSniperModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"sniper", 
            name : "Snipetron",
            masteryRank:0,
            'Impact':10,
            'Piercing':80,
            'Slashing':10,
            'Status Chance':10,
            'Fire Rate' : 1.5,
            'Magazine Capacity' : 4,
            'Reload Speed' : 3.8,
            'Crit Chance' : 0.20,
            'Crit Damage' : 1.5
           }
        })),

        new (SnipetronVandal = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewSniperModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"sniper", 
            name : "Snipetron Vandal",
            masteryRank:0,
            'Impact':6.25,
            'Piercing':112.5,
            'Slashing':6.25,
            'Status Chance':15, 
            'Fire Rate' : 1.5,
            'Magazine Capacity' : 6,
            'Reload Speed' : 2.0,
            'Crit Chance' : 0.25,
            'Crit Damage' : 2.0
           }
        })),
        
        new (Vectis = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewSniperModCollection('vectis'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"sniper", 
            name : "Vectis",
            masteryRank:3,
            'Impact':70,
            'Piercing':61.25,
            'Slashing':43.75,
            'Status Chance':45,
            'Fire Rate' : 1.5,
            'Magazine Capacity' : 1,
            'Reload Speed' : 1.0,
            'Crit Chance' : 0.25,
            'Crit Damage' : 2.0
           }
        })),

        new (Vulkar = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewSniperModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"sniper", 
            name : "Vulkar",
            masteryRank:1,
            'Impact':100,
            'Piercing':18.8,
            'Slashing':6.2,
            'Status Chance':10, 
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
        
        new (Cernos = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Cernos",
            masteryRank:0,
            'Impact':30,
            'Piercing':2,
            'Slashing':8,
            'Status Chance':15,
            'Fire Rate' : 1.0,
            'Magazine Capacity' : 1,
            'Reload Speed' : 0.8,
            'Crit Chance' : 0.20,
            'Crit Damage' : 1.5
           }
        })),
        
        new (CernosCharge = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Cernos (charge)",
            masteryRank:0,
            'Impact':75,
            'Piercing':5,
            'Slashing':20,
            'Status Chance':15,
            'Fire Rate' : 0.5,
            'Magazine Capacity' : 1,
            'Reload Speed' : 0.8,
            'Crit Chance' : 0.20,
            'Crit Damage' : 1.5
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
            name : "Dread",
            masteryRank:0,
            'Impact':6,
            'Piercing':6,
            'Slashing':48,
            'Status Chance':15,
            'Fire Rate' : 1.0,
            'Magazine Capacity' : 1,
            'Reload Speed' : 1.0,
            'Crit Chance' : 0.20,
            'Crit Damage' : 2.0
           }
        })),

        new (DreadCharge = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Dread (charge)",
            masteryRank:0,
            'Impact':15,
            'Piercing':15,
            'Slashing':120,
            'Status Chance':15, 
            'Fire Rate' : 0.5,
            'Magazine Capacity' : 1,
            'Reload Speed' : 1.0,
            'Crit Chance' : 0.20,
            'Crit Damage' : 2.0
           }
        })),

        new (Miter = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Miter",
            masteryRank:4,
            'Impact':10,
            'Piercing':5,
            'Slashing':35,
            'Status Chance':10,
            'Fire Rate' : 2.5,
            'Magazine Capacity' : 20,
            'Reload Speed' : 2.0,
            'Crit Chance' : 0.025,
            'Crit Damage' : 1.5
           }
        })),
        
        new (MiterCharge = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Miter (charge)",
            masteryRank:4,
            'Impact':30,
            'Piercing':15,
            'Slashing':105,
            'Status Chance':10, 
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
            'Impact':2.3,
            'Piercing':33.8,
            'Slashing':9.0,
            'Status Chance':10, 
            'Fire Rate' : 1.0,
            'Magazine Capacity' : 1,
            'Reload Speed' : 1.0,
            'Crit Chance' : 0.10,
            'Crit Damage' : 1.5
           }
        })),
        
        new (ParisCharge = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Paris (charge)",
            masteryRank:0,
            'Impact':5,
            'Piercing':75,
            'Slashing':20,
            'Status Chance':10,
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
            'Impact':3.3,
            'Piercing':55.3,
            'Slashing':6.5,
            'Status Chance':15, 
            'Fire Rate' : 1.0,
            'Magazine Capacity' : 1,
            'Reload Speed' : 1.0,
            'Crit Chance' : 0.20,
            'Crit Damage' : 1.5
           }
        })),
        
        new (ParisPrimeCharge = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection('crit'));
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            charge:true,
            weaponType:"bow", 
            name : "Paris Prime (charge)",
            masteryRank:4,
            'Impact':7.5,
            'Piercing':127.5,
            'Slashing':15,
            'Status Chance':15, 
            'Fire Rate' : 0.5,
            'Magazine Capacity' : 1.0,
            'Reload Speed' : 1.0,
            'Crit Chance' : 0.20,
            'Crit Damage' : 1.5
           }
        })),
        
        //
        // Sentinel Weapons
        //
        
        new (BurstLaser = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewPistolModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"sentinel", 
            name : "Burst Laser",
            masteryRank:0,
            'Impact':0.7,
            'Piercing':6.0,
            'Slashing':0.3,
            'Status Chance':2, 
            'Fire Rate' : 1.5,
            'Magazine Capacity' : 15,
            'Reload Speed' : 0.0,
            'Crit Chance' : 0,
            'Crit Damage' : 1.5
           }
        })),
        
        new (DethMachineRifle = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"sentinel", 
            name : "Deth Machine Rifle",
            masteryRank:0,
            'Impact':0.5,
            'Piercing':0.3,
            'Slashing':4.2,
            'Status Chance':1, 
            'Fire Rate' : 8.3,
            'Magazine Capacity' : 100,
            'Reload Speed' : 2.0,
            'Crit Chance' : 0,
            'Crit Damage' : 1.5
           }
        })),
        
        new (LaserRifle = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"sentinel", 
            name : "Laser Rifle",
            masteryRank:0,
            'Impact':0.3,
            'Piercing':2.4,
            'Slashing':0.3,
            'Status Chance':2, 
            'Fire Rate' : 6.7,
            'Magazine Capacity' : 5,
            'Reload Speed' : 2.0,
            'Crit Chance' : 0,
            'Crit Damage' : 1.5
           }
        })),
        
        new (Stinger = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewRifleModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"sentinel", 
            name : "Stinger",
            masteryRank:0,
            'Toxic':15,
            'Status Chance':5, 
            'Fire Rate' : 3.3,
            'Magazine Capacity' : 4,
            'Reload Speed' : 1.2,
            'Crit Chance' : 0.025,
            'Crit Damage' : 1.5
           }
        })),
        
        new (Sweeper = Weapon.extend({
           initialize:function(){
             this.set('modules', Modules.getNewShotgunModCollection());
             this.constructor.__super__.initialize.apply(this);
           },
           defaults:{
            weaponType:"sentinel", 
            name : "Sweeper",
            masteryRank:0,
            Projectiles:6,
            'Impact':35.7,
            'Piercing':2.1,
            'Slashing':4.2,
            'Status Chance':2, 
            'Fire Rate' : 1.0,
            'Magazine Capacity' : 10,
            'Reload Speed' : 2.3,
            'Crit Chance' : 0.05,
            'Crit Damage' : 1.5
           }
        }))
    ]);
    return this;
});
