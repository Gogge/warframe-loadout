define(['jquery', 'underscore', 'backbone', 'loadout/weapons', 'loadout/enemies', 'loadout/auras', 'loadout/views/weaponModule', 'loadout/views/weaponSort', 'loadout/views/search', 'loadout/views/modControl'],
function   ($, _, Backbone, Weapons, Enemies, Auras, WeaponModuleView, WeaponSortView, SearchView, ModControlView) {
    
    WeaponView = Backbone.View.extend({
        tagName:"div",
        className:"innerBox",
        initialize:function(){
            _.bindAll(this, "renderModule");
            _.bindAll(this, "renderAura");
             $(this.el).addClass(this.model.get("weaponType"));
             this.$el.addClass("normal");
        },
        events: {
            "click div.fav": "addFavorite",
            "click div.share.rem": "removeShare",
            "click div.share.pop": "sharePopup",
            "mouseenter table.damage": "descriptionPopup",
            "mouseleave table.damage": "descriptionPopup",
            "mouseenter table.stats": "statsPopup",
            "mouseleave table.stats": "statsPopup",
            "mouseenter .infested": "infestedPopup",
            "mouseleave .infested": "infestedPopdown",
            "mouseenter .grineer": "grineerPopup",
            "mouseleave .grineer": "grineerPopdown",
            "mouseenter .corpus": "corpusPopup",
            "mouseleave .corpus": "corpusPopdown",
            "mouseenter .corrupted": "corruptedPopup",
            "mouseleave .corrupted": "corruptedPopdown"
            //"click span.name": "toggleMinimized"
        },
        descriptionPopup:function(e){
            this.$el.find(".popup.dps").toggleClass("hidden");
        },
        statsPopup:function(e){
            this.$el.find(".popup.stats").toggleClass("hidden");
        },
        infestedPopup:function(e){
            var weapon = this.model;
            var result = weapon.get('result');
            var disrupter = new Enemies.AncientDisrupter();
            var healer = new Enemies.AncientHealer();
            var charger = new Enemies.InfestedCharger();
            var runner = new Enemies.InfestedRunner();
            var corrosiveProjection = weapon.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];
            
            var alts = {};
            alts.disrupterResult = disrupter.getDamageTaken(result, 25, corrosiveProjection);
            alts.healerResult = healer.getDamageTaken(result, 25, corrosiveProjection);
            alts.chargerResult = charger.getDamageTaken(result, 25, corrosiveProjection);
            alts.runnerResult = runner.getDamageTaken(result, 25, corrosiveProjection);
            alts.disrupter = disrupter;
            alts.healer = healer;
            alts.charger = charger;
            alts.runner = runner;
            alts.infested = result.infested;
            
            var elem = this.$el.find(".popup.infested");
            var factionDamageTemplate = _.template($("#infestedFactionDamageTemplate").html());
            elem.html(factionDamageTemplate({alts:alts, result:result}));
            this.$el.find(".popup.infested").removeClass("hidden");
        },
        infestedPopdown:function(e){
            this.$el.find(".popup").addClass("hidden");
        },
        grineerPopup:function(e){
            var weapon = this.model;
            var result = weapon.get('result');
            var napalm = new Enemies.GrineerNapalm();
            var gunner = new Enemies.GrineerHeavyGunner();
            var lancer = new Enemies.GrineerLancer();
            var corrosiveProjection = weapon.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];
            
            var alts = {};
            alts.napalmResult = napalm.getDamageTaken(result, 25, corrosiveProjection);
            alts.gunnerResult = gunner.getDamageTaken(result, 25, corrosiveProjection);
            alts.lancerResult = lancer.getDamageTaken(result, 25, corrosiveProjection);
            alts.napalm = napalm;
            alts.gunner = gunner;
            alts.lancer = lancer;
            alts.grineer = result.grineer;
            
            var elem = this.$el.find(".popup.grineer");
            var factionDamageTemplate = _.template($("#grineerFactionDamageTemplate").html());
            elem.html(factionDamageTemplate({alts:alts, result:result}));
            this.$el.find(".popup.grineer").removeClass("hidden");
        },
        grineerPopdown:function(e){
            this.$el.find(".popup").addClass("hidden");
        },
        corpusPopup:function(e){
            var weapon = this.model;
            var result = weapon.get('result');
            var tech = new Enemies.CorpusTech();
            var crewman = new Enemies.CorpusCrewman();
            var moa = new Enemies.CorpusShockwaveMoa();
            var corrosiveProjection = weapon.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];
            
            var alts = {};
            alts.techResult = tech.getDamageTaken(result, 25, corrosiveProjection);
            alts.crewmanResult = crewman.getDamageTaken(result, 25, corrosiveProjection);
            alts.moaResult = moa.getDamageTaken(result, 25, corrosiveProjection);
            alts.tech = tech;
            alts.crewman = crewman;
            alts.moa = moa;
            alts.corpus = result.corpus;
            
            var elem = this.$el.find(".popup.corpus");
            var factionDamageTemplate = _.template($("#corpusFactionDamageTemplate").html());
            elem.html(factionDamageTemplate({alts:alts, result:result}));
            this.$el.find(".popup.corpus").removeClass("hidden");
        },
        corpusPopdown:function(e){
            this.$el.find(".popup").addClass("hidden");
        },
        corruptedPopup:function(e){
            var weapon = this.model;
            var result = weapon.get('result');
            var crewman = new Enemies.CorruptedCrewman();
            var lancer = new Enemies.CorruptedLancer();
            var gunner = new Enemies.CorruptedHeavyGunner();
            var ancient = new Enemies.CorruptedAncient();
            var moa = new Enemies.CorruptedMoa();
            var corrosiveProjection = weapon.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];
            
            var alts = {};
            alts.crewmanResult = crewman.getDamageTaken(result, 25, corrosiveProjection);
            alts.lancerResult = lancer.getDamageTaken(result, 25, corrosiveProjection);
            alts.gunnerResult = gunner.getDamageTaken(result, 25, corrosiveProjection);
            alts.ancientResult = ancient.getDamageTaken(result, 25, corrosiveProjection);
            alts.moaResult = moa.getDamageTaken(result, 25, corrosiveProjection);
            alts.crewman = crewman;
            alts.lancer = lancer;
            alts.gunner = gunner;
            alts.ancient = ancient;
            alts.moa = moa;
            alts.corrupted = result.corrupted;
            
            var elem = this.$el.find(".popup.corrupted");
            var factionDamageTemplate = _.template($("#corruptedFactionDamageTemplate").html());
            elem.html(factionDamageTemplate({alts:alts, result:result}));
            this.$el.find(".popup.corrupted").removeClass("hidden");
        },
        corruptedPopdown:function(e){
            this.$el.find(".popup").addClass("hidden");
        },
        toggleMinimized:function(){
            this.$el.toggleClass("minimized");
        },
        removeShare:function(){
            this.$el.toggleClass("remove");
            var self = this;
            _.delay(function(){ self.options.shareCollection.remove(self.model); }, 500);
        },
        sharePopup:function(){
            var url = window.location.href;
            if(url.indexOf("#") !== -1){
                // Trim away the part after #
                url = url.slice(0, (url.indexOf('#')));
            }
            var popup = this.$el.find(".popup.sharepopup");
            var wIndex = Weapons.weaponList.indexOf(Weapons.weaponList.findWhere({name:this.model.get('name')})).toString(36);
            var wAuras = "";
            var wMods = "";
            var auras = this.model.get('auras').models;
            var modules = this.model.get('modules').models;
            
            for (var aura in auras){
                wAuras += auras[aura].get('currentRank').toString(36);
            };

            for (var mod in modules){
                wMods += modules[mod].get('currentRank').toString(36);
            };
            
            popup.children("input").val(url + "#" + wIndex + "/" + wAuras + "/" + wMods);
            popup.toggleClass("hidden");
            popup.children(".shareText")[0].select();
        },
        addFavorite:function(){
            if(this.options.categoryName === "Favorite"){
                this.$el.toggleClass("remove");
                var self = this;
                _.delay(function(){ self.options.favoriteCollection.remove(self.model); }, 500);
                
            } else {
                var clonedWeapon = new this.model.constructor();
                var clonedModules = clonedWeapon.get('modules');
                var originalModules = this.model.get('modules').models;
                for(var mod in originalModules){
                    clonedModules.models[mod] = $.extend(true, {}, originalModules[mod]);
                }
                clonedWeapon.set('modules', clonedModules);
                
                var clonedAuras = clonedWeapon.get('auras');
                var originalAuras = this.model.get('auras').models;
                for(var aura in originalAuras){
                    clonedAuras.models[aura] = $.extend(true, {}, originalAuras[aura]);
                }
                clonedWeapon.set('auras', clonedAuras);
                // Update DPS stats after cloning the mods/aura, stats is from the default configuration otherwise
                clonedWeapon.updateModuleDps();
                clonedWeapon.set('firstRender', true);
                
                this.options.favoriteCollection.add(clonedWeapon);
            }
        },
        renderModule:function(model){
            var moduleView = new WeaponModuleView.ModuleView({model:model, weaponView:this});
            moduleView.render();
            return moduleView;

        },
        renderAura:function(model){
            var auraView = new Auras.AuraView({model:model, weaponView:this});
            auraView.render();
            this.$el.find(".auras").append(auraView.el);
            return auraView;

        },
        updateDps:function(){
            var weapon = this.model;
            weapon.updateModuleDps();
        },
        render:function(){
            var weapon = this.model;
            var enemy = new Enemies.Enemy();
            
            var template = _.template($("#weaponTemplate").html());
            this.$el.html(template({weapon:weapon, result:weapon.get('result'), enemy:enemy, Enemies:Enemies, categoryName:this.options.categoryName}));
            
            this.model.get("auras").each(this.renderAura);
            
            var modules = this.model.get("modules");
            var mod_quartet = $('<div/>', {
                        class:'quart'
                    });
            // This was originally meant to separate modules into columns of four 
            // hence the "quart" but then the layout changed and it got increased.        
            for(var i = 0, l = modules.length; i < l; i++){
                var module = modules.models[i];
                var moduleview = this.renderModule(module);
                mod_quartet.append(moduleview.el);
                if (((i+1)%9 === 0) && (i+1 !== l)) {
                    $(this.el).find(".modules").append(mod_quartet);
                    mod_quartet = $('<div/>', {
                        class:'quart'
                    });
                }
            }
            $(this.el).find(".modules").append(mod_quartet);
            
            if(this.options.categoryName === "Favorite"){
                if(weapon.get('firstRender')){
                    this.$el.addClass("remove");
                }
                var stringList = [];
                this.options.favoriteCollection.each(function(weapon){
                    stringList.push(weapon.getSimpleString());
                });
                $.cookie('favorites', stringList);
            }
            
            if(this.options.categoryName === "Linked"){
                if(weapon.get('firstRender')){
                    this.$el.addClass("remove");
                }
                var stringList = [];
                this.options.shareCollection.each(function(weapon){
                    stringList.push(weapon.getSimpleString());
                });
                $.cookie('linked', stringList);
            }
        }
    });

    WeaponListView = Backbone.View.extend({
        tagName:"div",
        className:"weaponListView",
        initialize:function(){
            _.bindAll(this, "renderWeapon");
            this.options.collection.sort();
        },
        renderWeapon:function(model){
            var weaponView = new WeaponView({model:model, favoriteCollection:this.options.favoriteCollection, shareCollection:this.options.shareCollection, categoryName:this.options.categoryName});
            //_.extend(weaponView, Backbone.Events);
            weaponView.render();
            $(this.el).children(".weaponTypeHeader").append(weaponView.el);
            if(this.options.categoryName === "Favorite"){
                var weapon = model;
                if(weapon.get('firstRender')){
                    var elem = this.$el.find(".remove");
                    elem.focus();
                    elem.removeClass("remove");

                    weapon.set('firstRender', false);
                }
            }
            weaponView.listenTo(this.collection, 'quickRender', weaponView.render);
        },
        quickRender:function(){
            this.collection.trigger('quickRender');
        },
        render:function(){
            // When we re-render the elements the old dynamic classes disappear, 
            // we need to remember the hidden status for favorites to remain hidden 
            // when it's re-rendered
            var fav_hidden = $("#favorite.hidden").length;
            var weaponHeaderTemplate = _.template($("#weaponHeaderTemplate").html());
            $(this.el).html(weaponHeaderTemplate({weaponType:this.options.categoryName}));
            
            // Note to self: update the sort options in weapons.js
            var sortList = new WeaponSortView.SortCollection([
                new WeaponSortView.SortType({name:"Name", option:"name"}),
                new WeaponSortView.SortType({name:"DPS", option:"dps"}),
                new WeaponSortView.SortType({name:"Burst", option:"burst"}),
                //new WeaponSortView.SortType({name:"AP DPS", option:"apdps"}),
                new WeaponSortView.SortType({name:"Shot", option:"shot"}),
                new WeaponSortView.SortType({name:"Procs", option:"procs"}),
                new WeaponSortView.SortType({name:"Infested", option:"infestedDps"}),
                new WeaponSortView.SortType({name:"Grineer", option:"grineerDps"}),
                new WeaponSortView.SortType({name:"Corpus", option:"corpusDps"}),
                new WeaponSortView.SortType({name:"Void", option:"corruptedDps"})
            ]);
            var sortListView = new WeaponSortView.SortListView({collection:sortList, weaponCategory:this.collection, weaponCategoryView:this});
            sortListView.render();
            $(this.el).find("#sortContainer").append(sortListView.el);
            
            // Module Control
            var modControlView = new ModControlView.ModControlView({weaponCategory:this.collection, weaponCategoryView:this});
            modControlView.render();
            $(this.el).find("#modControlContainer").append(modControlView.el);

            
            // For some reason the favorites list CSS bugs when binding and/or using setTimeout, so we skip it
            if(this.options.categoryName === "Favorite"){
                this.collection.each(this.renderWeapon);
            } else {
                // We use a setTimeout to allow input/interrupts to happen between weapon calculations, avoids the browser freezing
                for(var i = 0;i<this.collection.models.length;i++){
                    var temp = _.bind(this.renderWeapon, this, this.collection.models[i]);
                    setTimeout(temp, i);
                }
            }

            if((this.options.categoryName === "Favorite")){
                if (this.collection.length === 0) {
                    $.cookie('favorites', "");
                }
                if(fav_hidden){
                    $(this.el).find("#favorite").addClass("hidden");
                }
            }
            if((this.options.categoryName === "Linked")){
                if (this.collection.length === 0) {
                    $.cookie('linked', "");
                }
            }
        }
    });
    
    WeaponCategoryView = Backbone.View.extend({
        tagName:"div",
        className:"weaponCategoryView",
        initialize:function(){
            _.bindAll(this, "renderCategory");
        },
        renderCategory:function(collection, categoryName, favoriteCollection, shareCollection){
            var weaponCategory = new WeaponListView({collection:collection, categoryName:categoryName, favoriteCollection:favoriteCollection, shareCollection:shareCollection});
            weaponCategory.render();
            if(categoryName === "Favorite"){
                weaponCategory.listenTo(favoriteCollection, 'add remove', weaponCategory.render);
            } else if(categoryName === "Linked"){
                weaponCategory.listenTo(shareCollection, 'add remove', weaponCategory.render);
            } else {
                weaponCategory.listenToOnce(collection, 'weaponLoad', weaponCategory.render);
            }
            $(this.el).append(weaponCategory.el);
            if(categoryName === "Favorite"){
                var searchView = new SearchView.SearchView({collection:collection});
                searchView.render();
                this.$el.append(searchView.el);
            }
        },
        render:function(){
            for(var key in this.options.list){
                this.renderCategory(this.options.list[key], key, this.options.list["Favorite"], this.options.list["Linked"]);
            }
        }
    });
    
    return this;
});
