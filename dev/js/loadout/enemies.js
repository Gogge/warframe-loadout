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
            var faction = this.get('faction');

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
            
            var modules = Object.keys(result['moduleDamageBreakdown']);
            var numModules = modules.length;
   
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
                var element = "";
                var tempElements = {};
                tempElements['Blast'] = 0;
                tempElements['Corrosive'] = 0;
                for(var key in result['damageBreakdown']){
                    if(result['damageBreakdown'][key] > 0){
                        if(key.indexOf('(DoT') === -1){
                            //alternatives[element][key] = result['damageBreakdown'][key];
                            if((key !== 'Toxic') && (key !== 'Electrical') && (key !== 'Fire') && (key !== 'Freeze')){
                                tempElements[key] = result['damageBreakdown'][key];
                                if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Blast') && (key !== 'Corrosive')){
                                    element += key + "/";
                                }
                            }
                        }
                    }
                }
                tempElements['Blast'] += blast;
                tempElements['Corrosive'] += corrosive;
                element += "Blast/Corrosive";
                
                alternatives[element] = tempElements;
            } else {
                if(blast){
                    // If the weapon has two modules and 
                    // if the weapon lacks a module with the same base element
                    // if the base damage type is a part of the combined element
                    if(!(numModules % 2) && 
                       !result['moduleDamageBreakdown'][result['baseDamageType']] &&
                       ((result['baseDamageType'] === "Freeze") || 
                        (result['baseDamageType'] === "Fire"))){
                    
                        // Skip
                        
                        // If we have formed blast and only have two modules then those two modules
                        // is what formed blast, any other combinations are invalid as the module merging
                        // has higher priority then the base element. If the base element is a part of the
                        // combined element but not the same as either of the two modules then it's an
                        // invalid combination.
                    } else {
                        var element = "";
                        var tempElements = {};
                        tempElements['Blast'] = 0;
                        for(var key in result['damageBreakdown']){
                            if(result['damageBreakdown'][key] > 0){
                                if(key.indexOf('(DoT') === -1){
                                    //alternatives[element][key] = result['damageBreakdown'][key];
                                    if((key !== 'Fire') && (key !== 'Freeze')){
                                        tempElements[key] = result['damageBreakdown'][key];
                                        if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Blast')){
                                            element += key + "/";
                                        }
                                    }
                                }
                            }
                        }
                        tempElements['Blast'] += blast;
                        element += "Blast";

                        alternatives[element] = tempElements;
                    }
                }
                if(corrosive){
                    if(!(numModules % 2) && 
                       !result['moduleDamageBreakdown'][result['baseDamageType']] &&
                       ((result['baseDamageType'] === "Toxic") || 
                        (result['baseDamageType'] === "Electrical"))){
                    } else {
                        var element = "";
                        var tempElements = {};
                        tempElements['Corrosive'] = 0;
                        for(var key in result['damageBreakdown']){
                            if(result['damageBreakdown'][key] > 0){
                                if(key.indexOf('(DoT') === -1){
                                    //alternatives[element][key] = result['damageBreakdown'][key];
                                    if((key !== 'Toxic') && (key !== 'Electrical')){
                                        tempElements[key] = result['damageBreakdown'][key];
                                        if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Corrosive')){
                                            element += key + "/";
                                        }
                                    }
                                }
                            }
                        }
                        tempElements['Corrosive'] += corrosive;
                        element += "Corrosive";

                        alternatives[element] = tempElements;
                    }
                }
            }
            
            if(magnetic && gas){
                var element = "";
                var tempElements = {};
                tempElements['Magnetic'] = 0;
                tempElements['Gas'] = 0;
                for(var key in result['damageBreakdown']){
                    if(result['damageBreakdown'][key] > 0){
                        if(key.indexOf('(DoT') === -1){
                            //alternatives[element][key] = result['damageBreakdown'][key];
                            if((key !== 'Toxic') && (key !== 'Fire') && (key !== 'Electrical') && (key !== 'Freeze')){
                                tempElements[key] = result['damageBreakdown'][key];
                                if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Magnetic') && (key !== 'Gas')){
                                    element += key + "/";
                                }
                            }
                        }
                    }
                }
                tempElements['Magnetic'] += magnetic;
                tempElements['Gas'] += gas;
                element += "Magnetic/Gas";
                
                alternatives[element] = tempElements;
            } else {
                if(magnetic){
                    if(!(numModules % 2) && 
                       !result['moduleDamageBreakdown'][result['baseDamageType']] &&
                       ((result['baseDamageType'] === "Freeze") || 
                        (result['baseDamageType'] === "Electrical"))){
                    
                        // Skip
                    
                    } else {
                        var element = "";
                        var tempElements = {};
                        tempElements['Magnetic'] = 0;
                        for(var key in result['damageBreakdown']){
                            if(result['damageBreakdown'][key] > 0){
                                if(key.indexOf('(DoT') === -1){
                                    //alternatives[element][key] = result['damageBreakdown'][key];
                                    if((key !== 'Freeze') && (key !== 'Electrical')){
                                        tempElements[key] = result['damageBreakdown'][key];
                                        if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Magnetic')){
                                            element += key + "/";
                                        }
                                    }
                                }
                            }
                        }
                        tempElements['Magnetic'] += magnetic;
                        element += "Magnetic";

                        alternatives[element] = tempElements;
                    }
                }
                if(gas){
                    if(!(numModules % 2) && 
                       !result['moduleDamageBreakdown'][result['baseDamageType']] &&
                       ((result['baseDamageType'] === "Toxic") || 
                        (result['baseDamageType'] === "Fire"))){

                        // Skip

                    } else {
                        var element = "";
                        var tempElements = {};
                        tempElements['Gas'] = 0;
                        for(var key in result['damageBreakdown']){
                            if(result['damageBreakdown'][key] > 0){
                                if(key.indexOf('(DoT') === -1){
                                    //alternatives[element][key] = result['damageBreakdown'][key];
                                    if((key !== 'Toxic') && (key !== 'Fire')){
                                        tempElements[key] = result['damageBreakdown'][key];
                                        if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Gas')){
                                            element += key + "/";
                                        }
                                    }
                                }
                            }
                        }
                        tempElements['Gas'] += gas;
                        element += "Gas";

                        alternatives[element] = tempElements;
                    }
                }
            }
            
            if(viral && radiation){
                var element = "";
                var tempElements = {};
                tempElements['Viral'] = 0;
                tempElements['Radiation'] = 0;
                for(var key in result['damageBreakdown']){
                    if(result['damageBreakdown'][key] > 0){
                        if(key.indexOf('(DoT') === -1){
                            //alternatives[element][key] = result['damageBreakdown'][key];
                            if((key !== 'Toxic') && (key !== 'Fire') && (key !== 'Electrical') && (key !== 'Freeze')){
                                tempElements[key] = result['damageBreakdown'][key];
                                if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Viral') && (key !== 'Radiation')){
                                    element += key + "/";
                                }
                            }
                        }
                    }
                }
                tempElements['Viral'] += viral;
                tempElements['Radiation'] += radiation;
                element += "Viral/Radiation";
                
                alternatives[element] = tempElements;
            } else {
                if(viral){
                    if(!(numModules % 2) && 
                       !result['moduleDamageBreakdown'][result['baseDamageType']] &&
                       ((result['baseDamageType'] === "Toxic") || 
                        (result['baseDamageType'] === "Freeze"))){
                    
                        // Skip
                        
                    } else {
                        var element = "";
                        var tempElements = {};
                        tempElements['Viral'] = 0;
                        for(var key in result['damageBreakdown']){
                            if(result['damageBreakdown'][key] > 0){
                                if(key.indexOf('(DoT') === -1){
                                    //alternatives[element][key] = result['damageBreakdown'][key];
                                    if((key !== 'Toxic') && (key !== 'Freeze')){
                                        tempElements[key] = result['damageBreakdown'][key];
                                        if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Viral')){
                                            element += key + "/";
                                        }
                                    }
                                }
                            }
                        }
                        tempElements['Viral'] += viral;
                        element += "Viral";

                        alternatives[element] = tempElements;
                    }
                }
                if(radiation){
                    if(!(numModules % 2) && 
                       !result['moduleDamageBreakdown'][result['baseDamageType']] &&
                       ((result['baseDamageType'] === "Electrical") || 
                        (result['baseDamageType'] === "Fire"))){
                    
                        // Skip
                        
                    } else {
                        var element = "";
                        var tempElements = {};
                        tempElements['Radiation'] = 0;
                        for(var key in result['damageBreakdown']){
                            if(result['damageBreakdown'][key] > 0){
                                if(key.indexOf('(DoT') === -1){
                                    //alternatives[element][key] = result['damageBreakdown'][key];
                                    if((key !== 'Electrical') && (key !== 'Fire')){
                                        tempElements[key] = result['damageBreakdown'][key];
                                        if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Radiation')){
                                            element += key + "/";
                                        }
                                    }
                                }
                            }
                        }
                        tempElements['Radiation'] += radiation;
                        element += "Radiation";

                        alternatives[element] = tempElements;
                    }
                }
            }
            // If no combinations it's a single element, or base damage
            if(blast + corrosive + magnetic + viral + gas + radiation === 0){                
                element = "";
                var tempElements = {};
                for(var key in result['damageBreakdown']){
                    if(result['damageBreakdown'][key] > 0){
                        if(key.indexOf('(DoT') === -1){
                            tempElements[key] = result['damageBreakdown'][key];
                            if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing')){
                                element += key + "/";
                            }
                        }
                    }
                }
                // Remove trailing slash
                if(element !== ""){
                    element = element.slice(0, - 1);
                } else {
                    element = "IPS";
                }
                
                alternatives[element] = tempElements;
            }
            
            // Iterate over each damage alternative and calculate damage/DPS
            for(var alt in alternatives){
                var localShieldDps = 0;
                var localShieldDotDps = 0;
                var localHealthDps = 0;
                var localHealthDotDps = 0;
//                var healthDpsMultiplier = 1;
//                // Who needs for loops?
//                var totalNoModifiersDamage = (alternatives[alt]['Corrosive']|| 0) +
//                        (alternatives[alt]['Viral']|| 0) +
//                        (alternatives[alt]['Gas']|| 0) +
//                        (alternatives[alt]['Magnetic']|| 0) +
//                        (alternatives[alt]['Radiation']|| 0) +
//                        (alternatives[alt]['Blast']|| 0) +
//                        (alternatives[alt]['Fire']|| 0) +
//                        (alternatives[alt]['Toxic']|| 0) +
//                        (alternatives[alt]['Electrical']|| 0) +
//                        (alternatives[alt]['Freeze']|| 0) +
//                        (alternatives[alt]['Impact']|| 0) +
//                        (alternatives[alt]['Piercing']|| 0) +
//                        (alternatives[alt]['Slashing']|| 0);
//                var dmCorrosive = 1+damageMultipliers['Corrosive']||1, 
//                        dmViral = 1+damageMultipliers['Viral']||1,
//                        dmGas = 1+damageMultipliers['Gas']||1,
//                        dmMagnetic = 1+damageMultipliers['Magnetic']||1,
//                        dmRadiation = 1+damageMultipliers['Radiation']||1,
//                        dmBlast = 1+damageMultipliers['Blast']||1,
//                        dmFire = 1+damageMultipliers['Fire']||1,
//                        dmToxic = 1+damageMultipliers['Toxic']||1,
//                        dmElectrical = 1+damageMultipliers['Electrical']||1,
//                        dmFreeze = 1+damageMultipliers['Freeze']||1,
//                        dmImpact = 1+damageMultipliers['Impact']||1,
//                        dmPiercing = 1+damageMultipliers['Piercing']||1,
//                        dmSlashing = 1+damageMultipliers['Slashing']||1;
//                var smCorrosive = 1+shieldMultipliers['Corrosive']||1, 
//                        smViral = 1+shieldMultipliers['Viral']||1,
//                        smGas = 1+shieldMultipliers['Gas']||1,
//                        smMagnetic = 1+shieldMultipliers['Magnetic']||1,
//                        smRadiation = 1+shieldMultipliers['Radiation']||1,
//                        smBlast = 1+shieldMultipliers['Blast']||1,
//                        smFire = 1+shieldMultipliers['Fire']||1,
//                        smToxic = 1+shieldMultipliers['Toxic']||1,
//                        smElectrical = 1+shieldMultipliers['Electrical']||1,
//                        smFreeze = 1+damageMultipliers['Freeze']||1,
//                        smImpact = 1+damageMultipliers['Impact']||1,
//                        smPiercing = 1+damageMultipliers['Piercing']||1,
//                        smSlashing = 1+damageMultipliers['Slashing']||1;
//                var amCorrosive = armorMultipliers['Corrosive']||0,
//                        amViral = armorMultipliers['Viral']||0,
//                        amGas = armorMultipliers['Gas']||0,
//                        amMagnetic = armorMultipliers['Magnetic']||0,
//                        amRadiation = armorMultipliers['Radiation']||0,
//                        amBlast = armorMultipliers['Blast']||0,
//                        amFire = armorMultipliers['Fire']||0,
//                        amToxic = armorMultipliers['Toxic']||0,
//                        amElectrical = armorMultipliers['Electrical']||0,
//                        amFreeze = armorMultipliers['Freeze']||0,
//                        amImpact = armorMultipliers['Impact']||0,
//                        amPiercing = armorMultipliers['Piercing']||0,
//                        amSlashing = armorMultipliers['Slashing']||0;
//                var damageCorrosive = ((alternatives[alt]['Corrosive']|| 0) * dmCorrosive * (300 / (armor * (1-amCorrosive) + 300)) * (1+amCorrosive)),
//                        damageViral = ((alternatives[alt]['Viral'] || 0) * dmViral * (300 / (armor * (1-amViral) + 300)) * (1+amViral)),
//                        damageGas = ((alternatives[alt]['Gas'] || 0) * dmGas * (300 / (armor * (1-amGas) + 300)) * (1+amGas)),
//                        damageMagnetic = ((alternatives[alt]['Magnetic'] || 0) * dmMagnetic * (300 / (armor * (1-amMagnetic) + 300)) * (1+amMagnetic)),
//                        damageRadiation = ((alternatives[alt]['Radiation'] || 0) * dmRadiation * (300 / (armor * (1-amRadiation) + 300)) * (1+amRadiation)),
//                        damageBlast = ((alternatives[alt]['Blast'] || 0) * dmBlast * (300 / (armor * (1-amBlast) + 300)) * (1+amBlast)),
//                        damageFire = ((alternatives[alt]['Fire'] || 0) * dmFire * (300 / (armor * (1-amFire) + 300)) * (1+amFire)),
//                        damageToxic = ((alternatives[alt]['Toxic'] || 0) * dmToxic * (300 / (armor * (1-amToxic) + 300)) * (1+amToxic)),
//                        damageElectrical = ((alternatives[alt]['Electrical'] || 0) * dmElectrical * (300 / (armor * (1-amElectrical) + 300)) * (1+amElectrical)),
//                        damageFreeze = ((alternatives[alt]['Freeze'] || 0) * dmFreeze * (300 / (armor * (1-amFreeze) + 300)) * (1+amFreeze)),
//                        damageImpact = ((alternatives[alt]['Impact'] || 0) * dmImpact * (300 / (armor * (1-amImpact) + 300)) * (1+amImpact)),
//                        damagePiercing = ((alternatives[alt]['Piercing'] || 0) * dmPiercing * (300 / (armor * (1-amPiercing) + 300)) * (1+amPiercing)),
//                        damageSlasing = ((alternatives[alt]['Slashing'] || 0) * dmSlashing * (300 / (armor * (1-amSlashing) + 300)) * (1+amSlashing));
//                var shieldDamageCorrosive = ((alternatives[alt]['Corrosive']|| 0) * smCorrosive),
//                        shieldDamageViral = ((alternatives[alt]['Viral'] || 0) * smViral),
//                        shieldDamageGas = ((alternatives[alt]['Gas'] || 0) * smGas),
//                        shieldDamageMagnetic = ((alternatives[alt]['Magnetic'] || 0) * smMagnetic),
//                        shieldDamageRadiation = ((alternatives[alt]['Radiation'] || 0) * smRadiation),
//                        shieldDamageBlast = ((alternatives[alt]['Blast'] || 0) * smBlast),
//                        shieldDamageFire = ((alternatives[alt]['Fire'] || 0) * smFire),
//                        shieldDamageToxic = ((alternatives[alt]['Toxic'] || 0) * smToxic),
//                        shieldDamageElectrical = ((alternatives[alt]['Electrical'] || 0) * smElectrical),
//                        shieldDamageFreeze = ((alternatives[alt]['Freeze'] || 0) * smFreeze),
//                        shieldDamageImpact = ((alternatives[alt]['Impact'] || 0) * smImpact),
//                        shieldDamagePiercing = ((alternatives[alt]['Piercing'] || 0) * smPiercing),
//                        shieldDamageSlasing = ((alternatives[alt]['Slashing'] || 0) * smSlashing);
//                var totalNonDotDamage = damageCorrosive + 
//                        damageViral + 
//                        damageGas + 
//                        damageMagnetic + 
//                        damageRadiation + 
//                        damageBlast + 
//                        damageFire + 
//                        damageToxic + 
//                        damageElectrical + 
//                        damageFreeze + 
//                        damageImpact + 
//                        damagePiercing + 
//                        damageSlasing;
//                var shieldTotalNonDotDamage = shieldDamageCorrosive + 
//                        shieldDamageViral + 
//                        shieldDamageGas + 
//                        shieldDamageMagnetic + 
//                        shieldDamageRadiation + 
//                        shieldDamageBlast + 
//                        shieldDamageFire + 
//                        shieldDamageToxic + 
//                        shieldDamageElectrical + 
//                        shieldDamageFreeze + 
//                        shieldDamageImpact + 
//                        shieldDamagePiercing + 
//                        shieldDamageSlasing;
//                var dotList = {};
//                var shieldRatio = shield/(shield+health);
//                // (health+shield) / ((localShieldDps * shieldRatio) + (localHealthDps * (1-shieldRatio)));
//                var baseDps = ((shieldTotalNonDotDamage * dpsFactor * shieldRatio) + (totalNonDotDamage * dpsFactor * (1-shieldRatio)));
//                var baseTTK = (health+shield) / baseDps;
//                var firedRounds = Math.max(baseTTK * result['Fire Rate'] * result['MultiShotMultiplier'], 1);
//                var roundsPerSecond = result['Fire Rate'] * result['MultiShotMultiplier'];
//                var roundsPerSecondChance = result['Fire Rate'] * result['MultiShotMultiplier'] * result['stats']['Status Chance'];
                
                // Status procs
                
//                if(alternatives[alt]['Corrosive'] > 0){
//                    var corrosiveArmorMultiplier = 0.75;
//                    var elementPartRatio = (alternatives[alt]['Corrosive']|| 0) / totalNoModifiersDamage;
//                    // We remove the first shot as the damage is applied before the proc
//                    var corrosiveStacks = (firedRounds-1)*result['stats']['Status Chance']*elementPartRatio;
//                    var corrosiveArmorEffect =  Math.pow(corrosiveArmorMultiplier, corrosiveStacks);
//                    
//                    armor *= corrosiveArmorEffect;
//                    
////                    if(this.get('name') === "Grineer"){
////                        console.log("---");
////                        console.log(baseDps);
////                        console.log(this.get('name'));
////                        console.log(health);
////                        console.log(shield);
////                        console.log(baseTTK);
////                        console.log(elementPartRatio);
////                        console.log("Status Chance: " + result['stats']['Status Chance']);
////                        console.log("corrosiveStacks: " + corrosiveStacks);
////                        console.log("corrosiveArmorEffect: " + corrosiveArmorEffect);
////                        console.log("armor: " + armor);
////                        console.log("firedRounds: " + firedRounds);
////                        console.log(result['MultiShotMultiplier']);
////                    }
//                }
//                
//                
//                
//                if(alternatives[alt]['Electrical']>0){
//                    var elementPartRatio = (alternatives[alt]['Electrical']|| 0) / totalNoModifiersDamage;
//                    var numProcs = firedRounds * result['stats']['Status Chance'] * elementPartRatio;
//
//                    //var procsPerSecond = result['Fire Rate'] * result['MultiShotMultiplier'] * result['stats']['Status Chance']* elementPartRatio;
//                    //var maxStacks = procsPerSecond*Math.min(baseTTK, 7);
//                    // The fire dot deals twice the damage dealth over 7 ticks, at one tick per second
//                    // For the average we divide by two, canceling out the double damage above
//                    var procDamageDone = numProcs * totalNoModifiersDamage*0.25;
////                    console.log("---");
////                    console.log(baseTTK);
////                    console.log(numProcs);
////                    console.log(elementPartRatio);
////                    //console.log(procsPerSecond);
////                    //console.log(maxStacks);
////                    console.log(procDamageDone);
////                    console.log(totalNoModifiersDamage);
//                    alternatives[alt]['Electrical'] += procDamageDone;
//                }
                
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
//                
//                 // Status procs
//                 var dotFactorHealth = {};
//                 var dotFactorShield = {};
//                 var combinedDps = (localShieldDps * shieldRatio) + (localHealthDps * (1-shieldRatio));
//                 var viralUptime = 0;
//                 
//                 if(alternatives[alt]['Fire']>0){
////                     var dotTicks = 7;
////                     var dotTime = 7;
////                     var tickTime = 1;
//                     var factor = 2;
//                     var elementPartRatio = (alternatives[alt]['Fire']|| 0) / totalNoModifiersDamage;
//                     var procsPerSecond = roundsPerSecondChance * elementPartRatio;
//                     var procFactor = procsPerSecond * factor; // Should also be "* tickTime/dotTicks" but it's 1.
//                     dotFactorHealth['Fire'] = procFactor * dmFire;
//                     dotFactorShield['Fire'] = procFactor * smFire;
//                 }
//                 
//                 if(alternatives[alt]['Toxic']>0){
////                     var dotTicks = 9;
////                     var dotTime = 9;
////                     var tickTime = 1;
//                     var factor = 2.25;
//                     var elementPartRatio = (alternatives[alt]['Toxic']|| 0) / totalNoModifiersDamage;
//                     var procsPerSecond = roundsPerSecondChance * elementPartRatio;
//                     var procFactor = procsPerSecond * factor; // tickTime/dotTicks is 1
//                     dotFactorHealth['Toxic'] = procFactor * dmToxic;
//                     dotFactorShield['Toxic'] = procFactor * smToxic;
//                 }
//                 
//                 if(specialDamage['DoT']){
//                     var dotTicks = specialDamage['DoT']['Ticks'];
//                     var tickTime = specialDamage['DoT']['ticksPerSecond'];
//                     for(var key in specialDamage['DoT']['damageBreakdown']){
//                         var procFactor = roundsPerSecond * specialDamage['DoT']['factor'] * tickTime / dotTicks ;
//                         if(!dotFactorHealth[key]){dotFactorHealth[key] = 0;}
//                         if(!dotFactorShield[key]){dotFactorShield[key] = 0;}
//                         dotFactorHealth[key] += procFactor * (1+damageMultipliers[key]||1);
//                         dotFactorShield[key] += procFactor * (1+shieldMultipliers[key]||1);
//                     }
//                 }
//                 
//                 //var combinedDotDps = (dotDpsShield['Toxic'] + dotDpsShield['Fire']) * shieldRatio + (dotDpsHealth['Toxic']* (300 / (armor * (1-amToxic) + 300)) * (1+amToxic)) + dotDpsHealth['Fire']) * (1-shieldRatio);
//                 //var testTTK = (health+shield) / (combinedDps + combinedDotDps);
//                 //console.log()
//                 
//                 if(alternatives[alt]['Viral'] > 0){
//                     var viralDpsMultiplier = 2;
//                     var viralDuration = 6;
//                     var elementPartRatio = (alternatives[alt]['Toxic']|| 0) / totalNoModifiersDamage;
//                     var procsPerSecond = roundsPerSecondChance * elementPartRatio;
//                     var avgFirstProc = (procsPerSecond + 1/roundsPerSecond)/2;
//                     viralUptime = Math.min(procsPerSecond * viralDuration, 1);
//                 }
//                 
//                 if(alternatives[alt]['Fire']>0){
//                    var elementPartRatio = (alternatives[alt]['Fire']|| 0) / totalNoModifiersDamage;
//                    var numProcs = firedRounds * result['stats']['Status Chance'] * elementPartRatio;
//                    var dotTicks = 7;
//                    var dotTime = 7;
//                    //var procsPerSecond = result['Fire Rate'] * result['MultiShotMultiplier'] * result['stats']['Status Chance']* elementPartRatio;
//                    //var maxStacks = procsPerSecond*Math.min(baseTTK, 7);
//                    // The fire dot deals twice the damage dealth over 7 ticks, at one tick per second
//                    var procDamageDone = numProcs * totalNoModifiersDamage*2/dotTicks * Math.min(baseTTK, dotTime) - 
//                            Math.max(Math.min(dotTicks-1, baseTTK-1)*totalNoModifiersDamage*2/dotTicks * Math.min(baseTTK, dotTime)/2, 0);
////                    console.log("---");
////                    console.log(baseTTK);
////                    console.log(numProcs);
////                    console.log(elementPartRatio);
////                    //console.log(procsPerSecond);
////                    //console.log(maxStacks);
////                    console.log(procDamageDone);
////                    console.log(totalNoModifiersDamage);
//                    alternatives[alt]['Fire'] += procDamageDone;
//                }
//                
//                if(alternatives[alt]['Toxic']>0){
//                    var elementPartRatio = (alternatives[alt]['Toxic']|| 0) / totalNoModifiersDamage;
//                    var numProcs = firedRounds * result['stats']['Status Chance'] * elementPartRatio;
//                    var dotTicks = 9;
//                    var dotTime = 9;
//                    //var procsPerSecond = result['Fire Rate'] * result['MultiShotMultiplier'] * result['stats']['Status Chance']* elementPartRatio;
//                    //var maxStacks = procsPerSecond*Math.min(baseTTK, 7);
//                    // The fire dot deals twice the damage dealth over 7 ticks, at one tick per second
//                    // For the average we divide by two, canceling out the double damage above
//                    var procDamageDone = numProcs * totalNoModifiersDamage*2/dotTicks * Math.min(baseTTK, dotTime) - 
//                            Math.max(Math.min(dotTicks-1, baseTTK-1)*totalNoModifiersDamage*2/dotTicks * Math.min(baseTTK, dotTime)/2, 0);
////                    console.log("---");
////                    console.log(baseTTK);
////                    console.log(numProcs);
////                    console.log(elementPartRatio);
////                    //console.log(procsPerSecond);
////                    //console.log(maxStacks);
////                    console.log(procDamageDone);
////                    console.log(totalNoModifiersDamage);
//                    alternatives[alt]['Toxic'] += procDamageDone;
//                }
//                
//                if(alternatives[alt]['Viral'] > 0){
//                    var viralDpsMultiplier = 2;
//                    var viralDuration = 6;
//                    var elementPartRatio = (alternatives[alt]['Viral']|| 0) / totalNoModifiersDamage;
//                    var shieldRatio = shield/(shield+health);
//                    //var baseTTK = (health+shield) / ((localShieldDps * shieldRatio) + (localHealthDps * (1-shieldRatio)));
//                    //var firedRounds = Math.max(baseTTK * result['Fire Rate'] * result['MultiShotMultiplier'], 1);
//                    // We remove the first shot as the damage is applied before the proc
//                    var shotsAffectedByViralProcs = Math.min((firedRounds-1)*result['stats']['Status Chance'], 1)* elementPartRatio * Math.min(baseTTK, viralDuration);
//                    var shotsAffectedByViralProcsRatio = shotsAffectedByViralProcs / firedRounds;
//                    var viralDpsEffect = Math.max(1 + shotsAffectedByViralProcsRatio * viralDpsMultiplier, 1);
//                    var viralFactorEffect = 1/viralDpsEffect;
//                    
//                    health *= viralFactorEffect;
//                    healthDpsMultiplier = viralDpsEffect;
////                    if(this.get('name') === "Infested"){
////                        console.log("---");
////                        console.log(this.get('name'));
////                        console.log((alternatives[alt]['Viral'] * dmViral * (300 / (armor * (1-amViral) + 300)) * (1+amViral)));
////                        console.log(totalNonDotDamage);
////                        console.log(elementPartRatio);
////                        console.log("healthDpsMultiplier: " + healthDpsMultiplier);
////                    }
//                }
//                
//                // Add the effect of Viral procs on DPS.
//                localHealthDps *= healthDpsMultiplier;
//                localHealthDotDps *= healthDpsMultiplier;
                
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
                
                // Subtract faction damage for unsupported factions, only Orokin in the Void at the moment.
                if(faction === "Orokin"){
                    localHealthDps /= result['factionMod'];
                    localShieldDps /= result['factionMod'];
                }
                
                var shieldRatio = shield/(shield+health);
                
               
                
                // Transform total damage to DPS
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
    
     AverageInfested = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Infested",
            baseLevel:1,
            level:1,
            baseArmor:0,
            baseShield:0,
            baseHealth:400,
            faction:"Infested",
            shieldMultipliers:{},
            armorMultipliers:{},
            damageMultipliers:{'Piercing':0.0625, 'Slashing':0.225, 'Fire':0.1875, 'Corrosive':0.1875, 'Gas':0.3125,'Freeze':-0.125, 'Toxic':-0.125, 'Radiation':-0.1875, 'Viral':-0.125}
        }
    });
    
    AncientDisrupter = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Ancient disrupter",
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
    
    AncientHealer = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Ancient healer",
            baseLevel:5,
            level:5,
            baseArmor:0,
            baseShield:0,
            baseHealth:400,
            faction:"Infested",
            shieldMultipliers:{},
            armorMultipliers:{},
            damageMultipliers:{'Piercing':0.25, 'Freeze':0.5, 'Radiation':0.5, 'Blast':-0.5}
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
    
    InfestedRunner = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Runner",
            baseLevel:1,
            level:1,
            baseArmor:0,
            baseShield:0,
            baseHealth:80,
            faction:"Infested",
            shieldMultipliers:{},
            armorMultipliers:{},
            damageMultipliers:{'Slashing':0.5, 'Fire':0.5, 'Gas':0.5, 'Freeze':-0.5}
        }
    });
    
    //
    // Grineer
    //
    
    AverageGrineer = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Grineer",
            baseLevel:1,
            level:1,
            baseArmor:100,
            baseShield:0,
            baseHealth:200,
            faction:"Grineer",
            shieldMultipliers:{},
            armorMultipliers:{'Piercing':0.325, 'Freeze':0.125, 'Toxic':0.125, 'Corrosive':0.375,'Radiation':0.375, 'Slashing':-0.325, 'Blast':-0.125, 'Electrical':-0.25, 'Magnetic':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
        }
    });
    
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
            armorMultipliers:{'Piercing':0.15, 'Freeze':0.25, 'Radiation':0.75, 'Slashing':-0.5, 'Electrical':-0.5, 'Magnetic':-0.5},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
        }
    });
    
    GrineerHeavyGunner = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Grineer Heavy Gunner",
            baseLevel:8,
            level:1,
            baseArmor:500,
            baseShield:0,
            baseHealth:300,
            faction:"Grineer",
            shieldMultipliers:{},
            armorMultipliers:{'Piercing':0.5, 'Corrosive':0.75, 'Toxic':0.25, 'Slashing':-0.15, 'Blast':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
        }
    });
    
    GrineerLancer = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Grineer Lancer",
            baseLevel:1,
            level:1,
            baseArmor:100,
            baseShield:0,
            baseHealth:100,
            faction:"Grineer",
            shieldMultipliers:{},
            armorMultipliers:{'Piercing':0.5, 'Corrosive':0.75, 'Toxic':0.25, 'Slashing':-0.15, 'Blast':-0.25},
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
            armorMultipliers:{'Piercing':0.5, 'Corrosive':0.75, 'Toxic':0.25, 'Slashing':-0.15, 'Blast':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
        }
    });
    
    //
    // Corpus
    //
    
    AverageCorpus = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corpus",
            baseLevel:1,
            level:1,
            baseArmor:0,
            baseShield:200,
            baseHealth:200,
            faction:"Corpus",
            armorMultipliers:{},
            shieldMultipliers:{'Impact':0.325, 'Freeze':0.25, 'Toxic':0.125,'Magnetic':0.75, 'Piercing':-0.325, 'Corrosive':-0.25,'Fire':-0.25,'Radiation':-0.125},
            damageMultipliers:{'Piercing':0.125, 'Electrical':0.25, 'Radiation':0.125, 'Toxic':0.125, 'Viral':0.25, 'Impact':-0.125, 'Gas':-0.125}
        }
    });
    
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
            shieldMultipliers:{'Impact':0.15, 'Toxic':0.25, 'Magnetic':0.75, 'Piercing':-0.5, 'Fire':-0.5, 'Corrosive':-0.5},
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
            shieldMultipliers:{'Impact':0.5, 'Freeze':0.5, 'Magnetic':0.75, 'Piercing':-0.15, 'Radiation':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Toxic':0.5, 'Viral':0.5, 'Impact':-0.25, 'Gas':-0.25}
        }
    });
    
    //
    // Void
    //
    
    AverageCorrupted = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corrupted",
            baseLevel:1,
            level:1,
            baseArmor:140,
            baseShield:80,
            baseHealth:300,
            faction:"Orokin",
            shieldMultipliers:{'Impact':0.2, 'Piercing':-0.06, 'Freeze':0.2, 'Magnetic':0.3, 'Radiation':-0.1},
            armorMultipliers:{'Piercing':0.13, 'Slashing':-0.13, 'Freeze':0.05, 'Electrical':-0.1, 'Toxic':0.05, 'Blast':-0.05, 'Corrosive':0.15, 'Magnetic':-0.1, 'Radiation':0.15},
            damageMultipliers:{'Impact':-0.15, 'Slashing':0.18, 'Cold':-0.05, 'Fire':0.1, 'Toxic':-0.05, 'Electrical':0.1, 'Freeze':-0.05, 'Blast':0.1, 'Corrosive':0.15, 'Gas':-0.25, 'Radiation':-0.1, 'Viral':0.4}
        }
    });
    
    CorruptedHeavyGunner = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corrupted Heavy Gunner",
            baseLevel:8,
            level:1,
            baseArmor:500,
            baseShield:0,
            baseHealth:700,
            faction:"Orokin",
            shieldMultipliers:{},
            // Ferrite
            armorMultipliers:{'Piercing':0.5, 'Corrosive':0.75, 'Toxic':0.25, 'Slashing':-0.15, 'Blast':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
        }
    });
    
    CorruptedAncient = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corrupted Ancient",
            baseLevel:5,
            level:5,
            baseArmor:0,
            baseShield:0,
            baseHealth:400,
            faction:"Orokin",
            shieldMultipliers:{},
            armorMultipliers:{},
            damageMultipliers:{'Slashing':0.15, 'Blast':0.5, 'Corrosive':0.75, 'Freeze':-0.25, 'Toxic':-0.5, 'Radiation':-0.75}
        }
    });
    
    CorruptedCrewman = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corrupted Crewman",
            baseLevel:10,
            level:1,
            baseArmor:0,
            baseShield:150,
            baseHealth:60,
            faction:"Orokin",
            armorMultipliers:{},
            shieldMultipliers:{'Impact':0.5, 'Freeze':0.5, 'Magnetic':0.75, 'Piercing':-0.15, 'Radiation':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Toxic':0.5, 'Viral':0.5, 'Impact':-0.25, 'Gas':-0.25}
        }
    });
    
    CorruptedLancer = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corrupted Lancer",
            baseLevel:10,
            level:1,
            baseArmor:200,
            baseShield:0,
            baseHealth:60,
            faction:"Orokin",
            shieldMultipliers:{},
            // Alloy
            armorMultipliers:{'Piercing':0.15, 'Freeze':0.25, 'Radiation':0.75, 'Slashing':-0.5, 'Electrical':-0.5, 'Magnetic':-0.5},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
        }
    });
    
    CorruptedMoa = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corrupted Moa",
            baseLevel:15,
            level:15,
            baseArmor:0,
            baseShield:250,
            baseHealth:250,
            faction:"Orokin",
            armorMultipliers:{},
            shieldMultipliers:{'Impact':0.5, 'Freeze':0.5, 'Magnetic':0.75, 'Piercing':-0.15, 'Radiation':-0.25},
            damageMultipliers:{'Piercing':0.25, 'Electrical':0.5, 'Radiation':0.25, 'Slashing':-0.25, 'Toxic':-0.25}
        }
    });
    
    return this;
});
