/**
 * Warframe Loadout v0.1e
 * http://dpsframe.com
 * Copyright 2013 Göran Christensen
 * Released under MIT license
 */

require.config({
    baseUrl: 'js/libs',
    paths: {
        jquery:'//code.jquery.com/jquery-1.10.1.min',
        loadout: '../loadout'
    },
    'shim': {
    "jquery-cookie"  : ["jquery"]
  }
});

require(['jquery', 'underscore', 'backbone', 'jquery-cookie', 'loadout/modules', 'loadout/weapons', 'loadout/enemies', 'loadout/auras', 'loadout/views/option', 'loadout/views/weapon', 'loadout/views/aura'],
function   ($, _, Backbone, Modules, Weapons, Enemies, Auras, OptionView, WeaponView, AuraView) {
    
    //
    // String to filter unwanted characters
    //
    urlFilterString = /[^a-zA-Z0-9/#]/g;
    
    $.expr[":"].icontains = $.expr.createPseudo(function (arg) {                                                                                                                                                                
        return function (elem) {                                                            
            return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;        
        };                                                                                  
    });
    
    $.cookie.json = true;
    
    var optionList = new OptionView.OptionsCollection([
        new Option({name:"Pistols", option:"pistol"}),
        new Option({name:"Rifles", option:"rifle"}), 
        new Option({name:"Shotguns", option:"shotgun"}), 
        new Option({name:"Sniper Rifles", option:"sniper"}), 
        new Option({name:"Bows/Other", option:"bow"}),
        new Option({name:"Linked", option:"linked"}),
        new Option({name:"Favorites", option:"favorite"})
    ]);
    
    var pistolList = new Weapons.WeaponCollection([]);
    var pistolArray = Weapons.weaponList.where({weaponType:"pistol"});
    for(var i = 0;i<pistolArray.length;i++){
        pistolList.add(new pistolArray[i].constructor());
    };
    
    var rifleList = new Weapons.WeaponCollection([]);
    var rifleArray = Weapons.weaponList.where({weaponType:"rifle"});
    for(var i = 0;i<rifleArray.length;i++){
        rifleList.add(new rifleArray[i].constructor());
    };
    
    var shotgunList = new Weapons.WeaponCollection([]);
    var shotgunArray = Weapons.weaponList.where({weaponType:"shotgun"});
    for(var i = 0;i<shotgunArray.length;i++){
        shotgunList.add(new shotgunArray[i].constructor());
    };
    
    var sniperList = new Weapons.WeaponCollection([]);
    var sniperArray = Weapons.weaponList.where({weaponType:"sniper"});
    for(var i = 0;i<sniperArray.length;i++){
        sniperList.add(new sniperArray[i].constructor());
    };
    
    var bowList = new Weapons.WeaponCollection([]);
    var bowArray = Weapons.weaponList.where({weaponType:"bow"});
    for(var i = 0;i<bowArray.length;i++){
        bowList.add(new bowArray[i].constructor());
    };
    
    //
    // Create new weapon/module/auras from saved cookie values
    //
   
    addWeaponsFromCookies = function(weaponStringList, weaponList){
        for(var i = 0;i<weaponStringList.length;i++){
            var weapon = Weapons.weaponList.where({name:weaponStringList[i].name})[0];
            if (weapon){
                var clonedWeapon = new weapon.constructor();
                var modules = clonedWeapon.get('modules').models;
                for(var mod in modules){
                    var currentModName = modules[mod].get('name');
                    // Need to check if the module exists in the saved cookie,
                    // might be that the mod list has been updated server side
                    if(weaponStringList[i].mods[currentModName] !== undefined){
                        modules[mod].set('currentRank', weaponStringList[i].mods[currentModName]);
                    }
                }
                clonedWeapon.get('modules').modules = modules;

                var auras = clonedWeapon.get('auras').models;
                for(var aura in auras){
                    var currentAuraName = auras[aura].get('name');
                    if(weaponStringList[i].auras[currentAuraName] !== undefined){
                        auras[aura].set('currentRank', weaponStringList[i].auras[currentAuraName]);
                    }
                }
                clonedWeapon.get('auras').modules = auras;

                clonedWeapon.set('firstRender', false);
                clonedWeapon.updateModuleDps();
                weaponList.add(clonedWeapon);
            }
        }
    };
    
    var favoriteList = new Weapons.WeaponCollection([]);
    //var weaponSimpleStringList = [];
    if($.cookie('favorites')) {
        addWeaponsFromCookies($.cookie('favorites'), favoriteList);
    };
    
    //
    // Create new weapon/module/auras from saved cookie values
    //
    var sharedList = new Weapons.WeaponCollection([]);
    
    if($.cookie('linked')) {
        addWeaponsFromCookies($.cookie('linked'), sharedList);
    };
    
    getWeaponFromSharedUrl = function(pageload){
        var url = window.location.href;
        if(url.indexOf('#') !== -1){
            var lastLink = $.cookie('lastLink');
            var urlString = url.slice(url.indexOf('#') + 1).replace(urlFilterString, '');
            var sharedString = url.slice(url.indexOf('#') + 1).replace(urlFilterString, '').split("/");
            
            // Check if we just added this weapon
            if (lastLink !== urlString){
                $.cookie('lastLink', urlString);
                if(sharedString && (sharedString[0].length !== 0)){
                    var weaponTemp = Weapons.weaponList.at(parseInt(sharedString[0], 36));
                    if(weaponTemp){
                        var weapon = new weaponTemp.constructor();
                        _.each(sharedString[1], function(aura, index){
                            if(index <= weapon.get('auras').models.length - 1){
                                weapon.get('auras').models[index].setModlevel(parseInt(aura,36));
                            }
                        });
                        _.each(sharedString[2], function(mod, index){
                            if(index <= weapon.get('modules').models.length - 1){
                                weapon.get('modules').models[index].setModlevel(parseInt(mod,36));
                            }
                        });
                        weapon.updateModuleDps();
                        sharedList.add(weapon);
                    }
                }
                // Show the linked option
                $(".mark").not(".favorite").addClass("faded");
                $(".mark.linked").removeClass("faded");
                $(".weaponTypeHeader").not(".favorite").addClass("hidden");
                $(".weaponTypeHeader.linked").removeClass("hidden");
            }
        }
    };
    
    $(window).on('hashchange', function() {
        getWeaponFromSharedUrl(false);
    });
    
    var weaponCategoriesList = {
            "Favorite":favoriteList,
            "Pistol":pistolList,
            "Rifle":rifleList, 
            "Shotgun":shotgunList, 
            "Sniper":sniperList, 
            "Bow":bowList,
            "Linked":sharedList
    };
    
    

    $(document).ready(function() {
        getWeaponFromSharedUrl(true);
        //
        // Options
        //
        
        var optionsListView = new OptionView.OptionsListView({collection:optionList});
        optionsListView.render();
        $("#optionsContainer").html(optionsListView.el);
        
        //
        // Weapons
        //
        var weaponView = new WeaponView.WeaponCategoryView({list:weaponCategoriesList});
        weaponView.render();
        $("#weaponContainer").html(weaponView.el);
        
        
        // Hide/show stuff based on cookie settings
        var hidden_options = Object.keys(weaponCategoriesList);
        hidden_options.shift(); // Unhide the first item in the list, favorites
        hidden_options.shift(); // Unhide the first item in the list, pistols
        if($.cookie('options')){
            hidden_options = $.cookie('options');
        } 

        for(var i = 0;i<hidden_options.length;i++){
            $(".mark." + hidden_options[i].toLowerCase()).addClass("faded");
            $(".weaponTypeHeader." + hidden_options[i]).addClass("hidden");
        }
        
        
    });
});