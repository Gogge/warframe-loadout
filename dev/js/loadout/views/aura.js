define(['jquery', 'underscore', 'backbone', 'loadout/modules', 'loadout/auras'],
function   ($, _, Backbone, Modules, Auras) {
    
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
            this.model.set('currentRank', 0);
            var modPercentages = weapon.getCalculatedModPercentages();
            var weaponResultZeroMod = weapon.getDps(modPercentages, "");
            this.model.set('currentRank', 5);
            modPercentages = weapon.getCalculatedModPercentages();
            var weaponResultOneMod = weapon.getDps(modPercentages, "");
            this.model.set('currentRank', this.model.get('maxRanks'));
            modPercentages = weapon.getCalculatedModPercentages();
            var weaponResultMaxMod = weapon.getDps(modPercentages, "");
            this.model.set('currentRank', currentRank);
            var modElement = this.$el.find(".popup");
            var onedps = (weaponResultOneMod.dps - weaponResultZeroMod.dps).toFixed(0);
            if (onedps >= 0) {
                onedps = "+" + onedps;
            }
            var oneapdps = (weaponResultOneMod.apdps - weaponResultZeroMod.apdps).toFixed(0);
            var maxdps = (weaponResultMaxMod.dps - weaponResultZeroMod.dps).toFixed(0);
            if (maxdps >= 0) {
                maxdps = "+" + maxdps;
            }
            var maxapdps = (weaponResultMaxMod.apdps - weaponResultZeroMod.apdps).toFixed(0);
            modElement.children(".totalAuraDps").html("<br>Total DPS (1): " + onedps + "/" + oneapdps);
            modElement.children(".totalAuraDps").append("<br>Total DPS (5): " + maxdps + "/" + maxapdps);
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

