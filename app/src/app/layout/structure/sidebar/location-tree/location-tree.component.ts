/*
* DATAGERRY - OpenSource Enterprise CMDB
* Copyright (C) 2023 becon GmbH
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { Component, OnInit } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { LocationService } from 'src/app/framework/services/location.service';
import { CollectionParameters } from 'src/app/services/models/api-parameter';
import { RenderResult } from '../../../../framework/models/cmdb-render';
import { takeUntil } from 'rxjs/operators';
import { APIGetMultiResponse } from 'src/app/services/models/api-response';
import { ReplaySubject, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { TreeManagerService } from 'src/app/services/tree-manager.service';
import { SidebarService } from 'src/app/layout/services/sidebar.service';

/* -------------------------------------------------------------------------- */
/*                                 INTERFACES                                 */
/* -------------------------------------------------------------------------- */

interface LocationNode {
    name: string;
    icon: string;
    parent: number;
    object_id: number;
    children?: LocationNode[];
}

/* -------------------------------------------------------------------------- */

@Component({
    selector: 'location-tree',
    templateUrl: './location-tree.component.html',
    styleUrls: ['./location-tree.component.scss'],
})
export class LocationTreeComponent implements OnInit {

    private unsubscribe: ReplaySubject<void> = new ReplaySubject<void>();
    public changedReference: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);

    treeControl = new NestedTreeControl<LocationNode>(node => node.children);
    dataSource = new MatTreeNestedDataSource<LocationNode>();

    /**
     * used for highlighting the selected location
     */
    private selectedLocationID: number;

  /* -------------------------------------------------------------------------- */
  /*                                LIFE - CYCLE                                */
  /* -------------------------------------------------------------------------- */


    constructor(private locationService: LocationService,
                private sidebarService: SidebarService,
                private treeManagerService: TreeManagerService,
                private route: Router){
        
    }


    public ngOnInit(){
        this.getLocationTree();

        if(!this.sidebarService.locationTreeComponent){
          this.sidebarService.locationTreeComponent = this;
        }
    }

    /* -------------------------------------------------------------------------- */
    /*                               TREE FUNCTIONS                               */
    /* -------------------------------------------------------------------------- */


    /**
    * Get all locations except the root location formatted as hierarchical tree data
    */
    private getLocationTree(){
        const params: CollectionParameters = {
          filter: [{ $match: { public_id: { $gt: 1 } } }],
          limit: 0, sort: 'public_id', order: 1, page: 1
        };
  
        this.locationService.getLocationsTree(params).pipe(takeUntil(this.unsubscribe))
              .subscribe((apiResponse: APIGetMultiResponse<RenderResult>) => {
                this.dataSource.data = this.forceCast<LocationNode[]>(apiResponse.results);
                this.treeManagerService.expandNodes(this.dataSource.data, this.treeControl);
        });
    }


    /**
    * Set the selected location and loads the object overview in the content view
    * 
    * @param clickedObjectID the objectID of the location which is clicked in location tree
    */
    private onLocationElementClicked(clickedObjectID: number){
        this.selectedLocationID = clickedObjectID;
        this.route.navigateByUrl('/framework/object/view/'+clickedObjectID);
     }


    /**
     * Updates status of all expanded locations and saves them
     */
    private onExpandClicked(){
        this.treeManagerService.extractExpandedIds(this.treeControl.expansionModel.selected);
    }

    /**
    * Checks if a node has a child
    */
    hasChild = (_: number, node: LocationNode) => !!node.children && node.children.length > 0;

    /**
     * Reloads the tree after an update
     */
    public reloadTree(){
      this.ngOnInit();
    }

    /* -------------------------------------------------------------------------- */
    /*                             HELPER - FUNCTIONS                             */
    /* -------------------------------------------------------------------------- */


    /**
    * This function is used to force cast to LocationNode[]
    * 
    * @param input api response with location tree
    * @returns array of LocationNode
    */
    public forceCast<T>(input: any): T {
      return input;
    }
}