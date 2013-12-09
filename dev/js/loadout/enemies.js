define(['jquery', 'underscore', 'backbone', 'loadout/auras'],
function   ($, _, Backbone, Auras) {
    Enemy = Backbone.Model.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Default enemy",
            baseLevel:1,
            level:1,
            baseArmor:0,
            faction:"Default"        
        },
        getArmor: function(level, corrosiveProjection){
            var baseArmor = this.get('baseArmor');
            var baseLevel = this.get('baseLevel');
            // From Pwnatron's spreadsheet:
            // (current_level - base_level)^1.40 * 0.01 * base_armor + base_armor
            var return_value =  (Math.pow((level - baseLevel),2.5) * 0.0025 * baseArmor + baseArmor) * (100 - corrosiveProjection) / 100;
            
            return return_value;
        },
        getDamageTaken:function(result, level, corrosiveProjection){
            var alternatives = {};
            var damageBreakdown = result.damageBreakdown;

            if(!level){
                level = this.get('level');
            }
            if(!corrosiveProjection){
                corrosiveProjection = 0;
            }
            var damageTaken = {};
            var armor = this.getArmor(level, corrosiveProjection);
            var armorMultipliers = this.get('armorMultipliers');
            var damageMultipliers = this.get('damageMultipliers');
            var shieldMultipliers = this.get('shieldMultipliers');
            var armorIgnore = this.get('armorIgnore');
            var shield = this.get('baseShield');
            var health = this.get('baseHealth');
            var dpsFactor = result["Magazine Capacity"] / (result["Magazine Capacity"] / result["Fire Rate"] + result["Reload Speed"]);
            
            var blast = 0;
            var magnetic = 0;
            var viral = 0;
            var corrosive = 0;
            var gas = 0;
            var radiation = 0;
            
            if ((result['damageBreakdown']['Fire'] !== 0) && (result['damageBreakdown']['Freeze'] !== 0)){
                blast = result['damageBreakdown']['Fire'] + result['damageBreakdown']['Freeze'];
            }
            if ((result['damageBreakdown']['Freeze'] !== 0) && (result['damageBreakdown']['Electrical'] !== 0)){
                magnetic = result['damageBreakdown']['Freeze'] + result['damageBreakdown']['Electrical'];
            }
            if ((result['damageBreakdown']['Freeze'] !== 0) && (result['damageBreakdown']['Toxic'] !== 0)){
                viral = result['damageBreakdown']['Freeze'] + result['damageBreakdown']['Toxic'];
            }
            if ((result['damageBreakdown']['Electrical'] !== 0) && (result['damageBreakdown']['Toxic'] !== 0)){
                corrosive = result['damageBreakdown']['Electrical'] + result['damageBreakdown']['Toxic'];
            }
            if ((result['damageBreakdown']['Fire'] !== 0) && (result['damageBreakdown']['Toxic'] !== 0)){
                gas = result['damageBreakdown']['Fire'] + result['damageBreakdown']['Toxic'];
            }
            if ((result['damageBreakdown']['Fire'] !== 0) && (result['damageBreakdown']['Electrical'] !== 0)){
                radiation = result['damageBreakdown']['Fire'] + result['damageBreakdown']['Electrical'];
            }
            
            if(blast && corrosive){
                alternatives['Blast/Corrosive'] = {};
                alternatives['Blast/Corrosive']['Impact'] = result['damageBreakdown']['Impact'];
                alternatives['Blast/Corrosive']['Piercing'] = result['damageBreakdown']['Piercing'];
                alternatives['Blast/Corrosive']['Slashing'] = result['damageBreakdown']['Slashing'];
                alternatives['Blast/Corrosive']['Blast'] = blast;
                alternatives['Blast/Corrosive']['Corrosive'] = corrosive;
            } else {
                if(blast){
                    var element = "Blast";
                    if(result['damageBreakdown']['Electrical']){
                        element = 'Blast/Electrical';
                    } else if(result['damageBreakdown']['Toxic']){
                        element = 'Blast/Toxic';
                    }
                    alternatives[element] = {};
                    alternatives[element]['Impact'] = result['damageBreakdown']['Impact'];
                    alternatives[element]['Piercing'] = result['damageBreakdown']['Piercing'];
                    alternatives[element]['Slashing'] = result['damageBreakdown']['Slashing'];
                    alternatives[element]['Electrical'] = result['damageBreakdown']['Electrical'];
                    alternatives[element]['Toxic'] = result['damageBreakdown']['Toxic'];
                    alternatives[element]['Blast'] = blast;
                }
                if(corrosive){
                    var element = "Corrosive";
                    if(result['damageBreakdown']['Fire']){
                        element = 'Corrosive/Fire';
                    } else if(result['damageBreakdown']['Freeze']){
                        element = 'Corrosive/Freeze';
                    }
                    alternatives[element] = {};
                    alternatives[element]['Impact'] = result['damageBreakdown']['Impact'];
                    alternatives[element]['Piercing'] = result['damageBreakdown']['Piercing'];
                    alternatives[element]['Slashing'] = result['damageBreakdown']['Slashing'];
                    alternatives[element]['Fire'] = result['damageBreakdown']['Fire'];
                    alternatives[element]['Freeze'] = result['damageBreakdown']['Freeze'];
                    alternatives[element]['Corrosive'] = corrosive;
                }
            }
            
            if(magnetic && gas){
                alternatives['Gas/Magnetic'] = {};
                alternatives['Gas/Magnetic']['Impact'] = result['damageBreakdown']['Impact'];
                alternatives['Gas/Magnetic']['Piercing'] = result['damageBreakdown']['Piercing'];
                alternatives['Gas/Magnetic']['Slashing'] = result['damageBreakdown']['Slashing'];
                alternatives['Gas/Magnetic']['Magnetic'] = magnetic;
                alternatives['Gas/Magnetic']['Gas'] = gas;
            } else {
                if(magnetic){
                    var element = "Magnetic";
                    if(result['damageBreakdown']['Fire']){
                        element = 'Magnetic/Fire';
                    } else if(result['damageBreakdown']['Toxic']){
                        element = 'Magnetic/Toxic';
                    }
                    alternatives[element] = {};
                    alternatives[element]['Impact'] = result['damageBreakdown']['Impact'];
                    alternatives[element]['Piercing'] = result['damageBreakdown']['Piercing'];
                    alternatives[element]['Slashing'] = result['damageBreakdown']['Slashing'];
                    alternatives[element]['Fire'] = result['damageBreakdown']['Fire'];
                    alternatives[element]['Toxic'] = result['damageBreakdown']['Toxic'];
                    alternatives[element]['Magnetic'] = magnetic;
                }
                if(gas){
                    var element = "Gas";
                    if(result['damageBreakdown']['Electrical']){
                        element = 'Gas/Electrical';
                    } else if(result['damageBreakdown']['Freeze']){
                        element = 'Gas/Freeze';
                    }
                    alternatives[element] = {};
                    alternatives[element]['Impact'] = result['damageBreakdown']['Impact'];
                    alternatives[element]['Piercing'] = result['damageBreakdown']['Piercing'];
                    alternatives[element]['Slashing'] = result['damageBreakdown']['Slashing'];
                    alternatives[element]['Electrical'] = result['damageBreakdown']['Electrical'];
                    alternatives[element]['Freeze'] = result['damageBreakdown']['Freeze'];
                    alternatives[element]['Gas'] = gas;
                }
            }
            
            if(viral && radiation){
                alternatives['Viral/Radiation'] = {};
                alternatives['Viral/Radiation']['Impact'] = result['damageBreakdown']['Impact'];
                alternatives['Viral/Radiation']['Piercing'] = result['damageBreakdown']['Piercing'];
                alternatives['Viral/Radiation']['Slashing'] = result['damageBreakdown']['Slashing'];
                alternatives['Viral/Radiation']['Viral'] = viral;
                alternatives['Viral/Radiation']['Radiation'] = radiation;
            } else {
                if(viral){
                    var element = "Viral";
                    if(result['damageBreakdown']['Electrical']){
                        element = 'Viral/Electrical';
                    } else if(result['damageBreakdown']['Fire']){
                        element = 'Viral/Fire';
                    }
                    alternatives[element] = {};
                    alternatives[element]['Impact'] = result['damageBreakdown']['Impact'];
                    alternatives[element]['Piercing'] = result['damageBreakdown']['Piercing'];
                    alternatives[element]['Slashing'] = result['damageBreakdown']['Slashing'];
                    alternatives[element]['Electrical'] = result['damageBreakdown']['Electrical'];
                    alternatives[element]['Fire'] = result['damageBreakdown']['Fire'];
                    alternatives[element]['Viral'] = viral;
                }
                if(radiation){
                    var element = "Radiation";
                    if(result['damageBreakdown']['Freeze']){
                        element = 'Radiation/Freeze';
                    } else if(result['damageBreakdown']['Toxic']){
                        element = 'Radiation/Toxic';
                    }
                    alternatives[element] = {};
                    alternatives[element]['Impact'] = result['damageBreakdown']['Impact'];
                    alternatives[element]['Piercing'] = result['damageBreakdown']['Piercing'];
                    alternatives[element]['Slashing'] = result['damageBreakdown']['Slashing'];
                    alternatives[element]['Freeze'] = result['damageBreakdown']['Freeze'];
                    alternatives[element]['Toxic'] = result['damageBreakdown']['Toxic'];
                    alternatives[element]['Radiation'] = radiation;
                }
            }
            // If no combinations it's a single element
            if(blast + corrosive + magnetic + viral + gas + radiation === 0){
                var element = "Pierce/Slash/Impact";
                if (result['damageBreakdown']['Fire']){
                    element = 'Fire';
                }
                if (result['damageBreakdown']['Freeze']){
                    element = 'Freeze';
                }
                if (result['damageBreakdown']['Electrical']){
                    element = 'Electrical';
                }
                if (result['damageBreakdown']['Toxic']){
                    element = 'Toxic';
                }
                alternatives[element] = {};
                alternatives[element]['Impact'] = result['damageBreakdown']['Impact'];
                alternatives[element]['Piercing'] = result['damageBreakdown']['Piercing'];
                alternatives[element]['Slashing'] = result['damageBreakdown']['Slashing'];
                if(element !== "Pierce/Slash/Impact"){
                    alternatives[element][element] = result['damageBreakdown'][element];
                }
                
            }
            // Iterate over each damage alternative and calculate damage/DPS
            for(var alt in alternatives){
                var localDamage = 0;
                var unmitigatedDamage = 0;
                var localShieldDps = 0;
                var localHealthDps = 0;
                // Iterate over each damage type
                for (var key in alternatives[alt]){
                    var localDamageTaken = 0;
                    var localShieldDamageTaken = 0;
                    
                    if(alternatives[alt][key]){
                        unmitigatedDamage += alternatives[alt][key];
                    }
                    
                    if(damageMultipliers[key] && alternatives[alt][key]){
                        localDamageTaken += alternatives[alt][key] * damageMultipliers[key];
                    } else {
                        localDamageTaken += alternatives[alt][key];
                    }
                    if(!armorIgnore[key]){
                        var armorMult = 1;
                        if (armorMultipliers[key]){
                            armorMult = armorMultipliers[key];
                        }
                        // From Pwnatron's spreadsheet:
                        // 100 / (armor + 100) * damage * damage_type_mp * special_spot_mp
                        // We (currently) just ignore weak spots, and damage multiplier has already been done above
                        
                        // In update 11 they squished the levels, so 100 armor is now 25% mitigation, and armor
                        // is mitigated by some elements
                        localDamageTaken = Math.max((1 - (armor / (armor + 300) * armorMult)) * localDamageTaken, 0);
                    }
                    localDamage += localDamageTaken;
                    
                    if(shieldMultipliers[key] && alternatives[alt][key]){
                        localShieldDamageTaken = alternatives[alt][key] * shieldMultipliers[key];
                        
                    } else {
                        localShieldDamageTaken = alternatives[alt][key];
                    }
                    
                    if (localShieldDamageTaken > 0) {
                        localShieldDps += localShieldDamageTaken * dpsFactor;
                    }
                    if (localDamageTaken > 0) {
                        localHealthDps += localDamageTaken * dpsFactor;
                    }
                }
                var shieldRatio = shield/health;
                // Transform total damage to DPS
                //alternatives[alt]['DPS'] = localDps * dpsFactor;
                alternatives[alt]['DPS'] = (localShieldDps * shieldRatio) + (localHealthDps * (1-shieldRatio));
                // Calculate combined shield + health DPS
                alternatives[alt]['shieldDps'] = localShieldDps;
                alternatives[alt]['healthDps'] = localHealthDps;
                alternatives[alt]['Unmitigated'] = unmitigatedDamage;
                alternatives[alt]['testDps'] = (localShieldDps * shieldRatio) + (localHealthDps * (1-shieldRatio));
            }
            return alternatives;
        }
    });
    
    //
    // Infested
    //
    
    AncientDisruptor = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Ancient disruptor",
            baseLevel:5,
            level:5,
            baseArmor:0,
            baseShield:0,
            baseHealth:400,
            faction:"Infested",
            shieldMultipliers:{},
            armorMultipliers:{},
            damageMultipliers:{'Impact':0.5, 'Piercing':0.5, 'Slashing':1.5, 'Fire':1.5, 'Blast':1.25, 'Electrical':0.75, 'Toxic':0.75},
            armorIgnore:{'Piercing':true}
        }
    });
    
    InfestedCharger = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Charger",
            baseLevel:1,
            level:1,
            baseArmor:0,
            baseShield:0,
            baseHealth:80,
            faction:"Infested",
            shieldMultipliers:{},
            armorMultipliers:{},
            damageMultipliers:{'Impact':0.5, 'Piercing':0.5, 'Slashing':1.5, 'Fire':1.5, 'Blast':1.25, 'Electrical':0.75, 'Toxic':0.75},
            armorIgnore:{'Piercing':true}
        }
    });
    
    //
    // Grineer
    //
    
    GrineerNapalm = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Grineer Napalm",
            baseLevel:6,
            level:6,
            baseArmor:500,
            baseShield:0,
            baseHealth:600,
            faction:"Grineer",
            shieldMultipliers:{},
            // Armor multipliers are inverted as they reduce armor, which increases damage
            armorMultipliers:{'Piercing':0.5, 'Freeze':1.5, 'Blast':0.75, 'Gas':0.75, 'Corrosive':0.25},
            damageMultipliers:{'Slashing':1.5, 'Fire':1.75, 'Toxic':1.5, 'Blast':1.25, 'Gas':1.25, 'Viral':2.0},
            //armorIgnore:{'Piercing':true}
            armorIgnore:{}
        }
    });
    
    GrineerTrooper = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Grineer Trooper",
            baseLevel:1,
            level:1,
            baseArmor:150,
            baseShield:0,
            baseHealth:120,
            faction:"Grineer",
            shieldMultipliers:{},
            // Armor multipliers are inverted as they reduce armor, which increases damage
            armorMultipliers:{'Piercing':0.5, 'Freeze':1.5, 'Blast':0.75, 'Gas':0.75, 'Corrosive':0.25},
            damageMultipliers:{'Slashing':1.5, 'Fire':1.75, 'Toxic':1.5, 'Blast':1.25, 'Gas':1.25, 'Viral':2.0},
            //armorIgnore:{'Piercing':true}
            armorIgnore:{}
        }
    });
    
    //
    // Corpus
    //
    
    CorpusShockwaveMoa = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corpus Shockwave Moa",
            baseLevel:15,
            level:15,
            baseArmor:0,
            baseShield:120,
            baseHealth:60,
            faction:"Corpus",
            armorMultipliers:{},
            shieldMultipliers:{'Impact':1.5, 'Cold':1.5, 'Blast':0.75, 'Magnetic':1.75},
            damageMultipliers:{'Slashing':0.5, 'Electrical':1.5, 'Toxic':0.5, 'Radiation':1.5, 'Gas':0.5, 'Magnetic':1.5, 'Viral':0.5, 'Corrosive':1.5},
            armorIgnore:{'Piercing':true}
        }
    });
    
    CorpusTech = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corpus Tech",
            baseLevel:15,
            level:15,
            baseArmor:0,
            baseShield:250,
            baseHealth:700,
            faction:"Corpus",
            armorMultipliers:{},
            shieldMultipliers:{'Impact':1.5, 'Cold':1.5, 'Blast':0.75, 'Magnetic':1.75},
            damageMultipliers:{'Slashing':1.5, 'Fire':1.75, 'Toxic':1.5, 'Blast':1.25, 'Gas':1.25, 'Viral':2.0},
            armorIgnore:{'Piercing':true}
        }
    });
    
    CorpusCrewman = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corpus Crewman",
            baseLevel:1,
            level:1,
            baseArmor:0,
            baseShield:150,
            baseHealth:60,
            faction:"Corpus",
            armorMultipliers:{},
            shieldMultipliers:{'Impact':1.5, 'Cold':1.5, 'Blast':0.75, 'Magnetic':1.75},
            damageMultipliers:{'Slashing':1.5, 'Fire':1.75, 'Toxic':1.5, 'Blast':1.25, 'Gas':1.25, 'Viral':2.0},
            armorIgnore:{'Piercing':true}
        }
    });
    
    return this;
});
