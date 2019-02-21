from cmdb.utils.interface_wraps import login_required
from cmdb.utils import get_logger
from flask import Blueprint, render_template, abort, current_app
from flask_breadcrumbs import default_breadcrumb_root, register_breadcrumb
from cmdb.utils.error import CMDBError
from cmdb.object_framework.cmdb_render import CmdbRender

LOGGER = get_logger()

type_pages = Blueprint('type_pages', __name__, template_folder='templates', url_prefix='/type')
default_breadcrumb_root(type_pages, '.type_pages')

with current_app.app_context():
    MANAGER_HOLDER = current_app.manager_holder


@type_pages.route('/')
@register_breadcrumb(type_pages, '.', 'Type')
def index_page():
    obm = MANAGER_HOLDER.get_object_manager()
    uum = MANAGER_HOLDER.get_user_manager()
    all_types = MANAGER_HOLDER.get_object_manager().get_all_types()
    return render_template('types/index.html', all_types=all_types, object_manager=obm, user_manager=uum)


@type_pages.route('/<int:public_id>')
@type_pages.route('/view/<int:public_id>')
@register_breadcrumb(type_pages, '.Type', 'View')
@login_required
def view_page(public_id):
    type_instance = None
    render = None
    try:
        type_instance = MANAGER_HOLDER.get_object_manager().get_type(public_id=public_id)
        render = CmdbRender(type_instance, mode=CmdbRender.SHOW_MODE)
    except CMDBError as e:
        LOGGER.warning(e.message)
        abort(500)
    return render_template('types/view.html', public_id=public_id, type_instance=type_instance, render=render,
                           user_manager=MANAGER_HOLDER.get_user_manager())


@type_pages.route('/edit/<int:public_id>')
@type_pages.route('/edit/<int:public_id>/')
@register_breadcrumb(type_pages, '.Type', 'Edit')
def edit_page(public_id):
    current_type = None
    try:
        current_type = MANAGER_HOLDER.get_object_manager().get_type(public_id=public_id)
    except CMDBError as e:
        LOGGER.warning(e.message)

    return render_template('types/edit.html', public_id=public_id, type=current_type)