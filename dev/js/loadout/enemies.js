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
            var return_value =  Math.max((Math.pow((level - baseLevel),1.75) * 0.005 * baseArmor + baseArmor) * (100 - corrosiveProjection) / 100, 0);
            
            return return_value;
        },
        getHealth:function(level){
            var effectiveLevel = level - this.get('baseLevel');
            var health = this.get('baseHealth');
            return Math.max((Math.pow(effectiveLevel,2) * 0.015 * health + health));
        },
        getShield:function(level){
            var shield = this.get('baseShield');
            var effectiveLevel = level - this.get('baseLevel');
            return Math.max((Math.pow(effectiveLevel,2) * 0.0075 * shield + shield));
        },
        getDamageTaken:function(result, level, corrosiveProjection){
            var alternatives = {};
            var damageBreakdown = result.damageBreakdown;
            var specialDamage = result.specialDamage;

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
            var shield = this.getShield(level);
            var health = this.getHealth(level);
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
                alternatives['Blast/Corrosive']['Blast'] = blast + result['damageBreakdown']['Blast'];
                alternatives['Blast/Corrosive']['Corrosive'] = corrosive + result['damageBreakdown']['Corrosive'];
                
                alternatives['Blast/Corrosive']['Magnetic'] = result['damageBreakdown']['Magnetic'];
                alternatives['Blast/Corrosive']['Viral'] = result['damageBreakdown']['Viral'];
                alternatives['Blast/Corrosive']['Gas'] = result['damageBreakdown']['Gas'];
                alternatives['Blast/Corrosive']['Radiation'] = result['damageBreakdown']['Radiation'];
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
                    alternatives[element]['Blast'] = blast + result['damageBreakdown']['Blast'];
                    
                    alternatives[element]['Corrosive'] = result['damageBreakdown']['Corrosive'];
                    alternatives[element]['Magnetic'] = result['damageBreakdown']['Magnetic'];
                    alternatives[element]['Viral'] = result['damageBreakdown']['Viral'];
                    alternatives[element]['Gas'] = result['damageBreakdown']['Gas'];
                    alternatives[element]['Radiation'] = result['damageBreakdown']['Radiation'];
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
                    alternatives[element]['Corrosive'] = corrosive + result['damageBreakdown']['Corrosive'];
                    
                    alternatives[element]['Blast'] = result['damageBreakdown']['Blast'];
                    alternatives[element]['Magnetic'] = result['damageBreakdown']['Magnetic'];
                    alternatives[element]['Viral'] = result['damageBreakdown']['Viral'];
                    alternatives[element]['Gas'] = result['damageBreakdown']['Gas'];
                    alternatives[element]['Radiation'] = result['damageBreakdown']['Radiation'];
                }
            }
            
            if(magnetic && gas){
                alternatives['Gas/Magnetic'] = {};
                alternatives['Gas/Magnetic']['Impact'] = result['damageBreakdown']['Impact'];
                alternatives['Gas/Magnetic']['Piercing'] = result['damageBreakdown']['Piercing'];
                alternatives['Gas/Magnetic']['Slashing'] = result['damageBreakdown']['Slashing'];
                alternatives['Gas/Magnetic']['Magnetic'] = magnetic + result['damageBreakdown']['Magnetic'];
                alternatives['Gas/Magnetic']['Gas'] = gas + result['damageBreakdown']['Gas'];;
                
                alternatives['Gas/Magnetic']['Blast'] = result['damageBreakdown']['Blast'];
                alternatives['Gas/Magnetic']['Corrosive'] = result['damageBreakdown']['Corrosive'];
                alternatives['Gas/Magnetic']['Viral'] = result['damageBreakdown']['Viral'];
                alternatives['Gas/Magnetic']['Radiation'] = result['damageBreakdown']['Radiation'];
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
                    alternatives[element]['Magnetic'] = magnetic + result['damageBreakdown']['Magnetic'];
                    
                    alternatives[element]['Blast'] = result['damageBreakdown']['Blast'];
                    alternatives[element]['Corrosive'] = result['damageBreakdown']['Corrosive'];
                    alternatives[element]['Viral'] = result['damageBreakdown']['Viral'];
                    alternatives[element]['Gas'] = result['damageBreakdown']['Gas'];
                    alternatives[element]['Radiation'] = result['damageBreakdown']['Radiation'];
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
                    alternatives[element]['Gas'] = gas + result['damageBreakdown']['Gas'];
                    
                    alternatives[element]['Blast'] = result['damageBreakdown']['Blast'];
                    alternatives[element]['Magnetic'] = result['damageBreakdown']['Magnetic'];
                    alternatives[element]['Corrosive'] = result['damageBreakdown']['Corrosive'];
                    alternatives[element]['Viral'] = result['damageBreakdown']['Viral'];
                    alternatives[element]['Radiation'] = result['damageBreakdown']['Radiation'];
                }
            }
            
            if(viral && radiation){
                alternatives['Viral/Radiation'] = {};
                alternatives['Viral/Radiation']['Impact'] = result['damageBreakdown']['Impact'];
                alternatives['Viral/Radiation']['Piercing'] = result['damageBreakdown']['Piercing'];
                alternatives['Viral/Radiation']['Slashing'] = result['damageBreakdown']['Slashing'];
                alternatives['Viral/Radiation']['Viral'] = viral + result['damageBreakdown']['Viral'];
                alternatives['Viral/Radiation']['Radiation'] = radiation + result['damageBreakdown']['Radiation'];
                
                alternatives['Viral/Radiation']['Blast'] = result['damageBreakdown']['Blast'];
                alternatives['Viral/Radiation']['Corrosive'] = result['damageBreakdown']['Corrosive'];
                alternatives['Viral/Radiation']['Gas'] = result['damageBreakdown']['Gas'];
                alternatives['Viral/Radiation']['Magnetic'] = result['damageBreakdown']['Magnetic'];
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
                    alternatives[element]['Viral'] = viral + result['damageBreakdown']['Viral'];
                    alternatives[element]['Radiation'] = result['damageBreakdown']['Radiation'];
                    
                    alternatives[element]['Blast'] = result['damageBreakdown']['Blast'];
                    alternatives[element]['Corrosive'] = result['damageBreakdown']['Corrosive'];
                    alternatives[element]['Gas'] = result['damageBreakdown']['Gas'];
                    alternatives[element]['Magnetic'] = result['damageBreakdown']['Magnetic'];
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
                    alternatives[element]['Radiation'] = radiation + result['damageBreakdown']['Radiation'];
                    alternatives[element]['Viral'] = result['damageBreakdown']['Viral'];
                    
                    alternatives[element]['Blast'] = result['damageBreakdown']['Blast'];
                    alternatives[element]['Corrosive'] = result['damageBreakdown']['Corrosive'];
                    alternatives[element]['Gas'] = result['damageBreakdown']['Gas'];
                    alternatives[element]['Magnetic'] = result['damageBreakdown']['Magnetic'];
                }
            }
            // If no combinations it's a single element, or base damage
            if(blast + corrosive + magnetic + viral + gas + radiation === 0){
                var element = "Base damage";
                // If there's a combination element use that instead.
                if (result['damageBreakdown']['Blast']){
                    element = 'Blast';
                }
                if (result['damageBreakdown']['Corrosive']){
                    element = 'Corrosive';
                }
                if (result['damageBreakdown']['Gas']){
                    element = 'Gas';
                }
                if (result['damageBreakdown']['Magnetic']){
                    element = 'Magnetic';
                }
                if (result['damageBreakdown']['Viral']){
                    element = 'Viral';
                }
                if (result['damageBreakdown']['Radiation']){
                    element = 'Radiation';
                }
                
                // If it's a single element use that
                if (result['damageBreakdown']['Fire']){
                    element = 'Fire';
                    if (result['damageBreakdown']['Blast']){
                        element = 'Blast';
                    }
                    if (result['damageBreakdown']['Gas']){
                        element = 'Gas';
                    }
                    if (result['damageBreakdown']['Radiation']){
                        element = 'Radiation';
                    }
                }
                if (result['damageBreakdown']['Freeze']){
                    element = 'Freeze';
                    if (result['damageBreakdown']['Blast']){
                        element = 'Blast';
                    }
                    if (result['damageBreakdown']['Magnetic']){
                        element = 'Magnetic';
                    }
                    if (result['damageBreakdown']['Viral']){
                        element = 'Viral';
                    }
                }
                if (result['damageBreakdown']['Electrical']){
                    element = 'Electrical';
                    if (result['damageBreakdown']['Corrosive']){
                        element = 'Corrosive';
                    }
                    if (result['damageBreakdown']['Magnetic']){
                        element = 'Magnetic';
                    }
                    if (result['damageBreakdown']['Radiation']){
                        element = 'Radiation';
                    }
                }
                if (result['damageBreakdown']['Toxic']){
                    element = 'Toxic';
                    if (result['damageBreakdown']['Viral']){
                        element = 'Viral';
                    }
                    if (result['damageBreakdown']['Gas']){
                        element = 'Gas';
                    }
                    if (result['damageBreakdown']['Corrosive']){
                        element = 'Corrosive';
                    }
                }
                
                alternatives[element] = {};
                for(var key in result['damageBreakdown']){
                    if(result['damageBreakdown'][key] > 0){
                        if(key.indexOf('(DoT') === -1){
                            alternatives[element][key] = result['damageBreakdown'][key];
                        }
                    }
                }
            }
            
            // Iterate over each damage alternative and calculate damage/DPS
            for(var alt in alternatives){
                var localShieldDps = 0;
                var localShieldDotDps = 0;
                var localHealthDps = 0;
                var localHealthDotDps = 0;
                
                // We iterate over the alternatives and add the specific dot elements, so they get processed
                // in the for-loop below
                if(specialDamage['DoT']){
                    for(var key in specialDamage['DoT']['damageBreakdown']){
                        if(!alternatives[alt][key]){
                            alternatives[alt][key] = 0;
                        }
                    }
                }
                
                // Iterate over each damage type
                for (var key in alternatives[alt]){
                    var localDamageTaken = 0;
                    var localDotDamageTaken = 0;
                    var localShieldDamageTaken = 0;
                    var localShieldDotDamageTaken = 0;
                    
                    if(damageMultipliers[key]){
                        localDamageTaken += alternatives[alt][key] * (1+damageMultipliers[key]);
                        if(specialDamage['DoT']){
                            if(specialDamage['DoT']['damageBreakdown'][key]){
                                localDotDamageTaken += (specialDamage['DoT']['damageBreakdown'][key] * (1+damageMultipliers[key])) / specialDamage['DoT']['ticks'];
                            }
                        }
                    } else {
                        localDamageTaken += alternatives[alt][key];
                        if(specialDamage['DoT']){
                            if(specialDamage['DoT']['damageBreakdown'][key]){
                                localDotDamageTaken += specialDamage['DoT']['damageBreakdown'][key] / specialDamage['DoT']['ticks'];
                            }
                        }
                    }
                    
                    var armorMult = 0;
                    if (armorMultipliers[key]){
                        armorMult = armorMultipliers[key];
                    }
                    // From Pwnatron's spreadsheet:
                    // 100 / (armor + 100) * damage * damage_type_mp * special_spot_mp
                    // We (currently) just ignore weak spots, and damage multiplier has already been done above

                    // In update 11 they squished the levels, so 100 armor is now 25% mitigation, and armor
                    // is mitigated by some elements
                    // 
                    // Pre 11.3.2:
                    //localDamageTaken = Math.max((1 - (armor / (armor + 300) * armorMult)) * localDamageTaken, 0);
                    //
                    // After 11.3.2:
                    // damage * armor reduction * (1 + armor multiplier)
                    localDamageTaken = Math.max(localDamageTaken * (300 / (armor * (1-armorMult) + 300)) * (1+armorMult), 0);
                    localDotDamageTaken = Math.max(localDotDamageTaken * (300 / (armor * (1-armorMult) + 300)) * (1+armorMult), 0);
                    
                    if(shieldMultipliers[key]){
                        localShieldDamageTaken += alternatives[alt][key] * (1+shieldMultipliers[key]);
                        if(specialDamage['DoT']){
                            if(specialDamage['DoT']['damageBreakdown'][key]){
                                localShieldDotDamageTaken += (specialDamage['DoT']['damageBreakdown'][key] * (1+shieldMultipliers[key])) / specialDamage['DoT']['ticks'];
                            }
                        }
                        
                    } else {
                        localShieldDamageTaken += alternatives[alt][key];
                        if(specialDamage['DoT']){
                            if(specialDamage['DoT']['damageBreakdown'][key]){
                                localShieldDotDamageTaken += specialDamage['DoT']['damageBreakdown'][key] / specialDamage['DoT']['ticks'];
                            }
                        }
                    }
                    
                    // Damage over time DPS
                  
                    if ((localShieldDamageTaken > 0) || (localShieldDotDamageTaken > 0)) {
                        localShieldDps += localShieldDamageTaken * dpsFactor;
                        if(specialDamage['DoT']){
                            if(specialDamage['DoT']['damageBreakdown'][key]){
                                localShieldDotDps += localShieldDotDamageTaken * dpsFactor;
                            }
                        } 
                    }
                    if ((localDamageTaken > 0) || (localDotDamageTaken > 0)) {
                        
                        localHealthDps += localDamageTaken * dpsFactor;
                        
                        if(specialDamage['DoT']){
                            if(specialDamage['DoT']['damageBreakdown'][key]){
                                localHealthDotDps += localDotDamageTaken * dpsFactor;
                            }
                        }
                    }
                }

                if(specialDamage['DoT']){
                    if(specialDamage['DoT']['damageBreakdown'][key]){
                        // We calculate how long it'll take to kill an enemy with an infinitely stacking dot
                        var ratio = -(2*localShieldDps+localShieldDotDps)/(2*localShieldDotDps);
                        var timeToKill = ratio + Math.sqrt((2*shield)/localShieldDotDps + ratio * ratio);
                        var dotDuration = specialDamage['DoT']['ticks'] / specialDamage['DoT']['ticksPerSecond'];
                        // If the enemy dies within the initial stacking period we just use that time to determine DPS
                        if(timeToKill !== 0){
                            if(timeToKill <= dotDuration){
                                localShieldDps = shield / timeToKill;
                            } else {
                                // If the enemy doesn't die within the stacking period we subtract the damage during the initial period
                                // from the HP and calculate the remaining time it would take to kill the mob with sustained DPS.
                                var tempDotDamage = dotDuration*(localShieldDotDps/2*(dotDuration+1) + localShieldDps);
                                var tempShield = shield - tempDotDamage;
                                timeToKill = dotDuration + tempShield / (localShieldDps + localShieldDotDps);
                                localShieldDps = shield / timeToKill;
                            }
                        }
                        
                        ratio = -(2*localHealthDps+localHealthDotDps)/(2*localHealthDotDps);
                        timeToKill = ratio + Math.sqrt((2*health)/localHealthDotDps + ratio * ratio);
                        
                        if(timeToKill !== 0){
                            if(timeToKill < dotDuration){
                                localHealthDps = health / timeToKill;
                            } else {
                                var tempDotDamage = dotDuration*(localHealthDotDps/2*(dotDuration+1) + localHealthDps);
                                var tempHealth = health - tempDotDamage;
                                timeToKill = dotDuration + tempHealth / ((localHealthDps + localHealthDotDps) * dpsFactor);
                                localHealthDps = health / timeToKill;
                            }
                            
                        }
                    }
                }
                
                var shieldRatio = shield/(shield+health);
                // Transform total damage to DPS
                //alternatives[alt]['DPS'] = localDps * dpsFactor;
                alternatives[alt]['DPS'] = (localShieldDps * shieldRatio) + (localHealthDps * (1-shieldRatio));
                // Calculate combined shield + health DPS
                alternatives[alt]['shieldDps'] = localShieldDps;
                alternatives[alt]['healthDps'] = localHealthDps;
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
            damageMultipliers:{'Slashing':0.15, 'Blast':0.5, 'Corrosive':0.75, 'Freeze':-0.25, 'Toxic':-0.5, 'Radiation':-0.75}
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
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Gas':0.75, 'Radiation':-0.5, 'Viral':-0.5}
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
            armorMultipliers:{'Piercing':0.15, 'Freeze':0.25, 'Radiation':0.75, 'Slashing':-0.5, 'Electricity':-0.5, 'Magnetic':-0.5},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
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
            armorMultipliers:{'Piercing':0.5, 'Corrosive':0.75, 'Toxic':0.25, 'Slashing':-0.15, 'Blast':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
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
            shieldMultipliers:{'Impact':0.5, 'Freeze':0.5, 'Magnetic':0.75, 'Piercing':-0.15, 'Radiation':-0.25},
            damageMultipliers:{'Piercing':0.25, 'Electrical':0.5, 'Radiation':0.25, 'Slashing':-0.25, 'Toxic':-0.25}
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
            shieldMultipliers:{'Impact':0.15, 'Toxic':0.25, 'Magnetic':0.75, 'Piercing':-0.5, 'Heat':-0.5, 'Corrosive':-0.5},
            damageMultipliers:{'Slashing':0.25, 'Toxic':0.5, 'Viral':0.5, 'Impact':-0.25, 'Gas':-0.25}
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
            shieldMultipliers:{'Impact':0.5, 'Cold':0.5, 'Magnetic':0.75, 'Piercing':-0.15, 'Radiation':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Toxic':0.5, 'Viral':0.5, 'Impact':-0.25, 'Gas':-0.25}
        }
    });
    return this;
});
