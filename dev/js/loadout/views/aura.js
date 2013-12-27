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
            var ancientDisruptor = new Enemies.AncientDisruptor();
            var grineerNapalm = new Enemies.GrineerNapalm();
            var corpusTech = new Enemies.CorpusTech();
            var corpusMoa = new Enemies.CorpusShockwaveMoa();   
            
            this.model.set('currentRank', 0);
            var modPercentages = weapon.getCalculatedModPercentages();
            var weaponResultZeroMod = weapon.getDps(modPercentages, "");
            var corrosiveProjection = weapon.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];
            var ancientAltsZeroMod = ancientDisruptor.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            var napalmAltsZeroMod = grineerNapalm.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            var techAltsZeroMod = corpusTech.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            var moaAltsZeroMod = corpusMoa.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            
            this.model.set('currentRank', 5);
            modPercentages = weapon.getCalculatedModPercentages();
            var weaponResultOneMod = weapon.getDps(modPercentages, "");
            corrosiveProjection = weapon.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];
            var ancientAltsOneMod = ancientDisruptor.getDamageTaken(weaponResultOneMod, 25, corrosiveProjection);
            var napalmAltsOneMod = grineerNapalm.getDamageTaken(weaponResultOneMod, 25, corrosiveProjection);
            var techAltsOneMod = corpusTech.getDamageTaken(weaponResultOneMod, 25, corrosiveProjection);
            var moaAltsOneMod = corpusMoa.getDamageTaken(weaponResultOneMod, 25, corrosiveProjection);
            
            this.model.set('currentRank', this.model.get('maxRanks'));
            modPercentages = weapon.getCalculatedModPercentages();
            var weaponResultMaxMod = weapon.getDps(modPercentages, "");
            corrosiveProjection = weapon.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];
            var ancientAltsMaxMod = ancientDisruptor.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            var napalmAltsMaxMod = grineerNapalm.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            var techAltsMaxMod = corpusTech.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            var moaAltsMaxMod = corpusMoa.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            
            this.model.set('currentRank', currentRank);
            var modElement = this.$el.find(".popup");

            modElement.children(".totalAuraDps").html("<br>Added DPS at max rank one person:");   

            var zeroKeys = Object.keys(ancientAltsZeroMod);
            var oneKeys = Object.keys(ancientAltsOneMod);
            
            var table = '<table class="scaling"><thead><tr><th>Type</th><th class="right">Ancient</th><th class="right">Napalm</th><th class="right">Tech</th><th class="right">MOA</th></tr></thead><tbody>';
            for(var i=0; i<oneKeys.length; i++){
                var zeroIndex = 0;
                if(zeroKeys.length === oneKeys.length){
                    zeroIndex = i;
                }
                var ancientDps = ancientAltsOneMod[oneKeys[i]]['DPS'] - ancientAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var napalmDps = napalmAltsOneMod[oneKeys[i]]['DPS'] - napalmAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var techDps = techAltsOneMod[oneKeys[i]]['DPS'] - techAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var moaDps = moaAltsOneMod[oneKeys[i]]['DPS'] - moaAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                table += '<tr><td>';
                table += oneKeys[i] + '</td><td class="right">' + ancientDps.toFixed(0)+ ' </td><td class="right">' + napalmDps.toFixed(0) + '</td><td class="right">' + techDps.toFixed(0) + '</td>' + '</td><td class="right">' + moaDps.toFixed(0) + '</td>';
                table += '</tr>';
            }
            table += '</tbody></table>';
            modElement.children(".totalAuraDps").append("<br>" + table);
            
            //
            // Aura max ranked (all five have it maxed)
            //
            
            modElement.children(".totalAuraDps").append("<br>Added DPS at max rank whole team:");

            var maxKeys = Object.keys(ancientAltsMaxMod);
            
            table = '<table class="scaling"><thead><tr><th>Type</th><th class="right">Ancient</th><th class="right">Napalm</th><th class="right">Tech</th><th class="right">MOA</th></tr></thead><tbody>';
            for(var i=0; i<maxKeys.length; i++){
                var zeroIndex = 0;
                if(zeroKeys.length === maxKeys.length){
                    zeroIndex = i;
                }
                var ancientDps = ancientAltsMaxMod[maxKeys[i]]['DPS'] - ancientAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var napalmDps = napalmAltsMaxMod[maxKeys[i]]['DPS'] - napalmAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var techDps = techAltsMaxMod[maxKeys[i]]['DPS'] - techAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var moaDps = moaAltsMaxMod[maxKeys[i]]['DPS'] - moaAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                table += '<tr><td>';
                table += maxKeys[i] + '</td><td class="right">' + ancientDps.toFixed(0)+ ' </td><td class="right">' + napalmDps.toFixed(0) + '</td><td class="right">' + techDps.toFixed(0) + '</td>' + '</td><td class="right">' + moaDps.toFixed(0) + '</td>';
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

