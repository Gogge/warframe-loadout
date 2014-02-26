define(['jquery', 'underscore', 'backbone', 'loadout/modules', 'loadout/auras', 'loadout/enemies'],
function   ($, _, Backbone, Modules, Auras, Enemies) {
    
    AuraView = Backbone.View.extend({
        tagname:"div",
        className:"aura cell",
        events: {
            "click div.inc": "increase",
            "click div.dec": "decrease",
            "click div.mid": "toggle",
            "mouseenter div.moduletext": "descriptionPopup",
            "mouseleave div.moduletext": "descriptionPopup"
        },

        increase: function(e){
            e.preventDefault();
            if ((this.model.get("currentRank") + 1) <= this.model.get("maxRanks")){
                this.model.set("currentRank", this.model.get("currentRank") + 1);
                this.options.weaponView.updateDps();
                this.options.weaponView.render();
            }
        },
        decrease: function(e){
            e.preventDefault();
            if ((this.model.get("currentRank") - 1) >= 0){
                this.model.set("currentRank", this.model.get("currentRank") - 1);
                this.options.weaponView.updateDps();
                this.options.weaponView.render();
            }
        },
        toggle: function(e){
            e.preventDefault();
            if (this.model.get("currentRank") > 0){
                this.model.set("currentRank", 0);
            } else {
                this.model.set("currentRank", this.model.get('maxRanks'));
            }
            this.options.weaponView.updateDps();
            this.options.weaponView.render();
        },
        
        descriptionPopup:function(e){
            var currentRank = this.model.get('currentRank');
            var weapon = this.options.weaponView.model;
            var infested = new Enemies.AverageInfested();
            var grineer = new Enemies.AverageGrineer();
            var corpus = new Enemies.AverageCorpus();
            var corrupted = new Enemies.AverageCorrupted();
            
            this.model.set('currentRank', 0);
            var modPercentages = weapon.getCalculatedModPercentages();
            var weaponResultZeroMod = weapon.getDps(modPercentages, "");
            var corrosiveProjection = weapon.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];
            var infestedAltsZeroMod = infested.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            var grineerAltsZeroMod = grineer.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            var corpusAltsZeroMod = corpus.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            var corruptedAltsZeroMod = corrupted.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            
            this.model.set('currentRank', 5);
            modPercentages = weapon.getCalculatedModPercentages();
            var weaponResultOneMod = weapon.getDps(modPercentages, "");
            corrosiveProjection = weapon.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];
            var infestedAltsOneMod = infested.getDamageTaken(weaponResultOneMod, 25, corrosiveProjection);
            var grineerAltsOneMod = grineer.getDamageTaken(weaponResultOneMod, 25, corrosiveProjection);
            var corpusAltsOneMod = corpus.getDamageTaken(weaponResultOneMod, 25, corrosiveProjection);
            var corruptedAltsOneMod = corrupted.getDamageTaken(weaponResultOneMod, 25, corrosiveProjection);
            
            this.model.set('currentRank', this.model.get('maxRanks'));
            modPercentages = weapon.getCalculatedModPercentages();
            var weaponResultMaxMod = weapon.getDps(modPercentages, "");
            corrosiveProjection = weapon.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];
            var infestedAltsMaxMod = infested.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            var grineerAltsMaxMod = grineer.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            var corpusAltsMaxMod = corpus.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            var corruptedAltsMaxMod = corrupted.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            
            this.model.set('currentRank', currentRank);
            var modElement = this.$el.find(".popup");

            modElement.children(".totalAuraDps").html("<br>Added DPS at max rank one person:");   

            var zeroKeys = Object.keys(infestedAltsZeroMod);
            var oneKeys = Object.keys(infestedAltsOneMod);
            
            var table = '<table class="scaling"><thead><tr><th>Type</th><th class="right">Infested</th><th class="right">Grineer</th><th class="right">Corpus</th><th class="right">Void</th></tr></thead><tbody>';
            for(var i=0; i<oneKeys.length; i++){
                var zeroIndex = 0;
                if(zeroKeys.length === oneKeys.length){
                    zeroIndex = i;
                }
                var infestedDps = infestedAltsOneMod[oneKeys[i]]['DPS'] - infestedAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var grineerDps = grineerAltsOneMod[oneKeys[i]]['DPS'] - grineerAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var corpusDps = corpusAltsOneMod[oneKeys[i]]['DPS'] - corpusAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var corruptedDps = corruptedAltsOneMod[oneKeys[i]]['DPS'] - corruptedAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];

                table += '<tr><td>';
                table += oneKeys[i] + '</td><td class="right">' + infestedDps.toFixed(0)+ ' </td><td class="right">' + grineerDps.toFixed(0) + '</td><td class="right">' + corpusDps.toFixed(0) + '</td><td class="right">' + corruptedDps.toFixed(0) + '</td>';
                table += '</tr>';
            }
            table += '</tbody></table>';
            modElement.children(".totalAuraDps").append("<br>" + table);
            
            //
            // Aura max ranked (all five have it maxed)
            //
            
            modElement.children(".totalAuraDps").append("<br>Added DPS at max rank whole team:");

            var maxKeys = Object.keys(infestedAltsMaxMod);
            
            table = '<table class="scaling"><thead><tr><th>Type</th><th class="right">Infested</th><th class="right">Grineer</th><th class="right">Corpus</th><th class="right">Void</th></tr></thead><tbody>';
            for(var i=0; i<maxKeys.length; i++){
                var zeroIndex = 0;
                if(zeroKeys.length === maxKeys.length){
                    zeroIndex = i;
                }
                var infestedDps = infestedAltsMaxMod[maxKeys[i]]['DPS'] - infestedAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var grineerDps = grineerAltsMaxMod[maxKeys[i]]['DPS'] - grineerAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var corpusDps = corpusAltsMaxMod[maxKeys[i]]['DPS'] - corpusAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var corruptedDps = corruptedAltsMaxMod[maxKeys[i]]['DPS'] - corruptedAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                
                table += '<tr><td>';
                table += maxKeys[i] + '</td><td class="right">' + infestedDps.toFixed(0)+ ' </td><td class="right">' + grineerDps.toFixed(0) + '</td><td class="right">' + corpusDps.toFixed(0) + '</td><td class="right">' + corruptedDps.toFixed(0) + '</td>';
                table += '</tr>';
            }
            table += '</tbody></table>';
            modElement.children(".totalAuraDps").append("<br>" + table);
            
            this.$el.find(".popup").toggleClass("hidden");
        },
        render:function(){
            var template = _.template($("#auraTemplate").html());
            this.$el.html(template({aura:this.model}));
        }
    });
    
    AuraListView = Backbone.View.extend({
        tagName:"div",
        className:"auraListView",
        initialize:function(){
            _.bindAll(this, "renderAura");
        },
        events:{
            "click div.recalc":"recalc"
        },
        recalc:function(e){
            console.log("click!");
            this.options.collection.trigger('weaponRender');
        },
        renderAura:function(model){
            var auraView = new AuraView({model:model, collection:this.collection});
            auraView.render();
            $(this.el).children("#auras").append(auraView.el);
        },
        render:function(){
            var auraHeaderTemplate = _.template($("#auraHeaderTemplate").html());
            $(this.el).html(auraHeaderTemplate());
            
            this.collection.each(this.renderAura);
        }
    });
    return this;
});

