<?php
namespace YiiNodeSocket\Frame;

interface IFrameFactory {

	/**
	 * @return Event
	 */
	public function createEventFrame();

	/**
	 * @return ChannelEvent
	 */
	public function createChannelEventFrame();

	/**
	 * @return Multiple
	 */
	public function createMultipleFrame();

	/**
	 * @return PublicData
	 */
	public function createPublicDataFrame();

	/**
	 * @return VolatileRoomEvent
	 */
	public function createVolatileRoomEventFrame();
}