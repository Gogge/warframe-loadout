define(['jquery', 'underscore', 'backbone', 'loadout/weapons', 'loadout/enemies', 'loadout/auras', 'loadout/views/weaponModule', 'loadout/views/weaponSort', 'loadout/views/search'],
function   ($, _, Backbone, Weapons, Enemies, Auras, WeaponModuleView, WeaponSortView, SearchView) {
    
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
            "mouseleave table.damage": "descriptionPopup"
            //"click span.name": "toggleMinimized"
        },
        descriptionPopup:function(e){
            this.$el.find(".popup.dps").toggleClass("hidden");
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
                if (((i+1)%7 === 0) && (i+1 !== l)) {
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
        },
        render:function(){
            // When we re-render the elements the old dynamic classes disappear, 
            // we need to remember the hidden status for favorites to remain hidden 
            // when it's re-rendered
            var fav_hidden = $("#favorite.hidden").length;
            var weaponHeaderTemplate = _.template($("#weaponHeaderTemplate").html());
            $(this.el).html(weaponHeaderTemplate({weaponType:this.options.categoryName}));
            
            var sortList = new WeaponSortView.SortCollection([
                new WeaponSortView.SortType({name:"Name", option:"name"}),
                new WeaponSortView.SortType({name:"DPS", option:"dps"}),
                new WeaponSortView.SortType({name:"AP DPS", option:"apdps"}),
                new WeaponSortView.SortType({name:"Shot", option:"shot"}),
                new WeaponSortView.SortType({name:"Burst", option:"burst"}),
            ]);
            var sortListView = new WeaponSortView.SortListView({collection:sortList, weaponCategory:this.collection, weaponCategoryView:this});
            sortListView.render();
            $(this.el).find("#sortContainer").append(sortListView.el);
            
            this.collection.each(this.renderWeapon);
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
                
            }
            if(categoryName === "Linked"){
                weaponCategory.listenTo(shareCollection, 'add remove', weaponCategory.render);
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
